import { verifyToken } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { Game } from '../models/Game.js';
import { User } from '../models/User.js';
import { TurnOrchestrator } from '../utils/TurnOrchestrator.js';
import { setupItemSocket } from './modules/itemSocket.js';
import { socketRateLimiter } from './socketRateLimiter.js';

// Función para calcular iniciativa basada en dexterity
const calculateInitiative = async (characters) => {
  return await TurnOrchestrator.calculateInitiative(characters);
};

// Función para encontrar grupos de empate
const findTiedGroups = (turnOrder) => {
  return TurnOrchestrator.findTiedGroups(turnOrder);
};

// Función para aplicar efectos de estados al inicio del turno
const applyStatusEffects = async (character) => {
  let hpChange = 0;
  let manaChange = 0;
  const expiredStatuses = [];
  const appliedEffects = [];

  for (const status of character.status) {
    if (!status.effects) continue;

    // Aplicar efectos de HP/Mana por turno
    if (status.effects.hpPerTurn) {
      hpChange += status.effects.hpPerTurn;
      appliedEffects.push({
        statusName: status.name,
        type: status.type,
        effect: 'hp',
        value: status.effects.hpPerTurn,
      });
    }
    if (status.effects.manaPerTurn) {
      manaChange += status.effects.manaPerTurn;
      appliedEffects.push({
        statusName: status.name,
        type: status.type,
        effect: 'mana',
        value: status.effects.manaPerTurn,
      });
    }

    // Reducir duración
    if (status.duration !== undefined && status.duration !== null) {
      status.duration -= 1;
      if (status.duration <= 0) {
        expiredStatuses.push(status.id);
      }
    }
  }

  // Aplicar cambios de HP (respetando límites)
  const oldHp = character.stats.hp;
  const oldMana = character.stats.mana;

  character.stats.hp = Math.min(
    Math.max(0, character.stats.hp + hpChange),
    character.stats.maxHp,
  );
  character.stats.mana = Math.min(
    Math.max(0, character.stats.mana + manaChange),
    character.stats.maxMana,
  );

  // Registrar cambios pendientes para visualización
  character.pendingChanges = {
    hp: character.stats.hp - oldHp,
    mana: character.stats.mana - oldMana,
    appliedAt: new Date(),
  };

  // Remover estados expirados
  if (expiredStatuses.length > 0) {
    character.status = character.status.filter(
      (s) => !expiredStatuses.includes(s.id),
    );
  }

  // Verificar si el personaje queda en KO
  let koWarning = false;

  if (character.stats.hp <= 0) {
    character.stats.hp = 0;
    if (!character.isKO) {
      // Primera vez que llega a 0, dar aviso de KO
      koWarning = true;
      character.koWarning = true;
    }
  }

  return {
    hpChange,
    manaChange,
    appliedEffects,
    expiredStatuses,
    koWarning,
    isKO: character.isKO,
    newHp: character.stats.hp,
    newMana: character.stats.mana,
  };
};

// Función para verificar y aplicar KO al inicio del turno
const checkAndApplyKO = async (character) => {
  if (character.koWarning && character.stats.hp <= 0) {
    character.isKO = true;
    character.koWarning = false;
    await character.save();
    return true; // El personaje está ahora en KO
  }
  return false;
};

export const setupGameSockets = (io) => {
  io.on('connection', (socket) => {
    // Aplicar rate limiting (máximo 20 eventos por segundo por socket)
    socket.use(
      socketRateLimiter.middleware({ maxRequests: 20, windowMs: 1000 }),
    );

    // Modular: Handlers de items
    setupItemSocket(io, socket);
    console.log('🎮 Usuario conectado:', socket.id);

    // Helper para obtener el usuario actual del socket
    const getCurrentUser = async () => {
      try {
        const token = socket.handshake.auth.token;
        const firebaseUser = await verifyToken(token);
        const googleId =
          firebaseUser.uid || firebaseUser.sub || firebaseUser.user_id;
        return await User.findOne({ googleId });
      } catch {
        return null;
      }
    };

    // Unirse al canal personal del usuario (para recibir actualizaciones de personajes)
    socket.on('join-user-channel', async () => {
      const user = await getCurrentUser();
      if (user) {
        const channelName = `user:${user._id}`;
        socket.join(channelName);
        console.log(
          `👤 Usuario ${user.name} unido a su canal personal: ${channelName}`,
        );
      } else {
        console.log('❌ No se pudo unir al canal: usuario no encontrado');
      }
    });

    const isDM = async (socket, gameId) => {
      const token = socket.handshake.auth.token;
      const firebaseUser = await verifyToken(token);
      const googleId =
        firebaseUser.uid || firebaseUser.sub || firebaseUser.user_id;
      const user = await User.findOne({ googleId });
      const game = await Game.findById(gameId);

      if (!user || !game) return false;

      return game.dmId.toString() === user._id.toString();
    };

    // --- ORDEN DE TURNOS ---

    // DM: Calcular orden de turnos basado en dexterity
    socket.on('dm:calculate-turn-order', async ({ gameId }) => {
      try {
        console.log(
          `📥 [socket:${socket.id}] dm:calculate-turn-order received for gameId=${gameId}`,
        );
        const authorized = await isDM(socket, gameId);
        console.log(`🔐 [socket:${socket.id}] isDM check result:`, authorized);
        if (!authorized) {
          socket.emit('error', { message: 'No autorizado' });
          return;
        }
      } catch (err) {
        console.log(
          `❌ [socket:${socket.id}] error during isDM check:`,
          err.message || err,
        );
        socket.emit('error', { message: 'Error de autorización' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        // Obtener todos los personajes de la partida (jugadores)
        const characterIds = game.players
          .filter((p) => p.characterId)
          .map((p) => p.characterId);

        const playerCharacters = await Character.find({
          _id: { $in: characterIds },
        });

        // Obtener todos los NPCs activos de la partida (no muertos)
        const npcCharacters = await Character.find({
          gameId: gameId,
          isNPC: true,
          isDead: { $ne: true },
        });

        // Combinar jugadores y NPCs
        const allCharacters = [...playerCharacters, ...npcCharacters];
        console.log(
          `📊 [socket:${socket.id}] allCharacters: ${allCharacters.length} (players: ${playerCharacters.length}, npcs: ${npcCharacters.length})`,
        );

        // Calcular iniciativa
        const turnOrder = await calculateInitiative(allCharacters);
        console.log(
          `📊 [socket:${socket.id}] turnOrder calculated:`,
          turnOrder.length,
          'characters',
        );

        // Guardar en la partida
        game.turnOrder = turnOrder;
        game.currentTurnIndex = 0;
        game.combatStarted = true;
        await game.save();

        // Encontrar empates
        const tiedGroups = findTiedGroups(turnOrder);
        console.log(`📊 [socket:${socket.id}] tiedGroups:`, tiedGroups);

        // Emitir a todos en la partida
        io.to(`game:${gameId}`).emit('turn-order-calculated', {
          turnOrder,
          currentTurnIndex: 0,
          tiedGroups,
          updatedBy: 'dm',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Resolver empate manualmente (reordenar personajes empatados)
    socket.on('dm:resolve-tie', async ({ gameId, reorderedCharacters }) => {
      try {
        console.log(
          `📥 [socket:${socket.id}] dm:resolve-tie received for gameId=${gameId}`,
        );
        console.log(
          '📥 payload reorderedCharacters:',
          JSON.stringify(reorderedCharacters),
        );
        const authorized = await isDM(socket, gameId);
        console.log(
          `🔐 [socket:${socket.id}] isDM check result for resolve-tie:`,
          authorized,
        );
        if (!authorized) {
          socket.emit('error', { message: 'No autorizado' });
          return;
        }
      } catch (err) {
        console.log(
          `❌ [socket:${socket.id}] error during isDM check (resolve-tie):`,
          err.message || err,
        );
        socket.emit('error', { message: 'Error de autorización' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        // Resolver el empate usando TurnOrchestrator
        game.turnOrder = TurnOrchestrator.resolveTie(
          game.turnOrder,
          reorderedCharacters,
        );

        await game.save();

        // Después de resolver manualmente, no hay empates pendientes
        const tiedGroups = [];

        io.to(`game:${gameId}`).emit('turn-order-updated', {
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
          tiedGroups,
          updatedBy: 'dm',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Actualizar el orden de turnos completo
    socket.on('dm:update-turn-order', async ({ gameId, turnOrder }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        // Verificar que el personaje con turno actual no cambie de posición
        const currentTurnCharId =
          game.turnOrder[game.currentTurnIndex]?.characterId?.toString();
        const newCurrentIndex = turnOrder.findIndex(
          (t) => t.characterId.toString() === currentTurnCharId,
        );

        if (
          newCurrentIndex !== -1 &&
          newCurrentIndex !== game.currentTurnIndex
        ) {
          socket.emit('error', {
            message: 'No puedes mover al personaje que tiene el turno actual',
          });
          return;
        }

        game.turnOrder = turnOrder.map((entry, index) => ({
          ...entry,
          position: index,
        }));
        await game.save();

        const tiedGroups = findTiedGroups(game.turnOrder);

        io.to(`game:${gameId}`).emit('turn-order-updated', {
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
          tiedGroups,
          updatedBy: 'dm',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Avanzar turno
    socket.on('dm:next-turn', async ({ gameId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game || game.turnOrder.length === 0) {
          socket.emit('error', { message: 'No hay orden de turnos' });
          return;
        }

        // Avanzar al siguiente turno (circular)
        game.currentTurnIndex =
          (game.currentTurnIndex + 1) % game.turnOrder.length;

        // Obtener el personaje del nuevo turno
        const currentTurnEntry = game.turnOrder[game.currentTurnIndex];
        const character = await Character.findById(
          currentTurnEntry.characterId,
        );

        let turnStartData = {
          currentTurnIndex: game.currentTurnIndex,
          currentCharacter: currentTurnEntry,
          updatedBy: 'dm',
        };

        if (character) {
          // Verificar si el personaje estaba con aviso de KO
          const justKOd = await checkAndApplyKO(character);

          if (justKOd) {
            // El personaje está ahora en KO, notificar
            turnStartData.characterKO = {
              characterId: character._id,
              name: character.name,
              isKO: true,
            };

            // Actualizar el estado KO en el turnOrder
            game.turnOrder[game.currentTurnIndex].isKO = true;
          } else if (character.isKO) {
            // El personaje ya está en KO
            turnStartData.characterKO = {
              characterId: character._id,
              name: character.name,
              isKO: true,
              wasAlreadyKO: true,
            };
          } else {
            // Aplicar efectos de estados al inicio del turno
            const effectsResult = await applyStatusEffects(character);
            await character.save();

            turnStartData.statusEffects = {
              characterId: character._id,
              ...effectsResult,
            };

            // Si el personaje tiene aviso de KO, notificar
            if (effectsResult.koWarning) {
              turnStartData.koWarning = {
                characterId: character._id,
                name: character.name,
                message: '¡KO en el siguiente turno si no se cura!',
              };
            }
          }
        }

        await game.save();

        io.to(`game:${gameId}`).emit('turn-advanced', turnStartData);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Terminar combate
    socket.on('dm:end-combat', async ({ gameId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        game.combatStarted = false;
        game.currentTurnIndex = 0;
        await game.save();

        io.to(`game:${gameId}`).emit('turn-order-updated', {
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
          tiedGroups: TurnOrchestrator.findTiedGroups(game.turnOrder),
          updatedBy: 'dm',
          combatStarted: false,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Forzar turno a un personaje específico
    socket.on('dm:force-turn', async ({ gameId, characterId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        const index = game.turnOrder.findIndex(
          (t) => t.characterId.toString() === characterId,
        );

        if (index === -1) {
          socket.emit('error', {
            message: 'Personaje no encontrado en el orden de turnos',
          });
          return;
        }

        game.currentTurnIndex = index;
        await game.save();

        io.to(`game:${gameId}`).emit('turn-forced', {
          characterId,
          currentTurnIndex: index,
          currentCharacter: game.turnOrder[index],
          updatedBy: 'dm',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Agregar personaje (NPC/Enemigo) al orden de turnos
    socket.on('dm:add-to-turn-order', async ({ gameId, characterId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        const character = await Character.findById(characterId);
        if (!character) {
          socket.emit('error', { message: 'Personaje no encontrado' });
          return;
        }

        // Verificar que no esté ya en el orden
        const alreadyInOrder = game.turnOrder.some(
          (t) => t.characterId.toString() === characterId,
        );

        if (alreadyInOrder) {
          socket.emit('error', {
            message: 'El personaje ya está en el orden de turnos',
          });
          return;
        }

        // Agregar el nuevo personaje
        const newEntry = {
          characterId: character._id,
          name: character.name,
          initiative: character.stats?.dexterity || 1,
          position: game.turnOrder.length,
          isNPC: character.isNPC || false,
          isKO: character.isKO || false,
        };

        // Agregar y recalcular posiciones
        game.turnOrder.push(newEntry);

        // Reordenar por iniciativa
        game.turnOrder.sort((a, b) => b.initiative - a.initiative);

        // Reasignar posiciones
        game.turnOrder = game.turnOrder.map((entry, index) => ({
          ...(entry.toObject ? entry.toObject() : entry),
          position: index,
        }));

        // Ajustar el índice del turno actual si es necesario
        const currentCharId =
          game.turnOrder[game.currentTurnIndex]?.characterId?.toString();
        if (currentCharId) {
          const newIndex = game.turnOrder.findIndex(
            (t) => t.characterId.toString() === currentCharId,
          );
          if (newIndex !== -1) {
            game.currentTurnIndex = newIndex;
          }
        }

        await game.save();

        const tiedGroups = findTiedGroups(game.turnOrder);

        io.to(`game:${gameId}`).emit('turn-order-updated', {
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
          tiedGroups,
          addedCharacter: newEntry,
          updatedBy: 'dm',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: Remover personaje del orden de turnos
    socket.on('dm:remove-from-turn-order', async ({ gameId, characterId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        // Verificar que no sea el personaje con turno actual
        const currentTurnCharId =
          game.turnOrder[game.currentTurnIndex]?.characterId?.toString();

        if (currentTurnCharId === characterId) {
          socket.emit('error', {
            message:
              'No puedes remover al personaje que tiene el turno actual. Avanza el turno primero.',
          });
          return;
        }

        // Remover el personaje
        game.turnOrder = game.turnOrder.filter(
          (t) => t.characterId.toString() !== characterId,
        );

        // Reasignar posiciones
        game.turnOrder = game.turnOrder.map((entry, index) => ({
          ...(entry.toObject ? entry.toObject() : entry),
          position: index,
        }));

        // Ajustar el índice del turno actual
        if (game.currentTurnIndex >= game.turnOrder.length) {
          game.currentTurnIndex = 0;
        }

        await game.save();

        const tiedGroups = findTiedGroups(game.turnOrder);

        io.to(`game:${gameId}`).emit('turn-order-updated', {
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
          tiedGroups,
          removedCharacterId: characterId,
          updatedBy: 'dm',
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Obtener el estado actual del orden de turnos
    socket.on('get-turn-order', async ({ gameId }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Partida no encontrada' });
          return;
        }

        const tiedGroups = findTiedGroups(game.turnOrder);

        socket.emit('turn-order-state', {
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
          combatStarted: game.combatStarted,
          tiedGroups,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Unirse a una partida
    socket.on('join-game', async ({ gameId, userId }) => {
      socket.join(`game:${gameId}`);
      console.log(`Usuario ${userId} se unió a la partida ${gameId}`);
      console.log(`Rooms del socket ${socket.id}:`, Array.from(socket.rooms));

      // Notificar a todos en la partida menos al que se une
      socket.to(`game:${gameId}`).emit('player-joined', { userId });

      // Notificar al usuario que se unió (confirmación)
      socket.emit('joined-game', { gameId, userId });
    });

    // DM: Permitir/denegar edición
    socket.on('dm:toggle-edit', async ({ characterId, canEdit, gameId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }
      const character = await Character.findById(characterId);
      if (!character) return;

      character.canEdit = canEdit;
      character.updatedAt = new Date();
      await character.save();

      // Emitir a todos en la partida
      io.to(`game:${gameId}`).emit('character-updated', {
        characterId,
        canEdit,
        updatedBy: 'dm',
      });

      // También emitir al canal personal del propietario
      io.to(`user:${character.playerId}`).emit('character-updated', {
        characterId,
        canEdit,
        updatedBy: 'dm',
      });
    });

    // DM: Actualizar stats/datos de un personaje
    socket.on(
      'dm:update-character',
      async ({ characterId, updates, gameId }) => {
        if (!(await isDM(socket, gameId))) {
          socket.emit('error', { message: 'No autorizado' });
          return;
        }

        try {
          const character = await Character.findById(characterId);
          if (!character) {
            socket.emit('error', { message: 'Personaje no encontrado' });
            return;
          }

          // Actualizar nombre si se proporciona
          if (updates.name) {
            character.name = updates.name;
          }

          // Actualizar clase si se proporciona
          if (updates.classType) {
            character.classType = updates.classType;
          }

          // Actualizar nivel si se proporciona
          if (updates.level !== undefined) {
            character.level = updates.level;
          }

          // Actualizar descripción si se proporciona
          if (updates.description !== undefined) {
            character.description = updates.description;
          }

          // Actualizar stats si se proporcionan (incluye HP, maxHp, mana, maxMana)
          if (updates.stats) {
            character.stats = {
              ...character.stats,
              ...updates.stats,
            };
          }

          character.updatedAt = new Date();
          await character.save();

          const updatePayload = {
            characterId,
            name: character.name,
            classType: character.classType,
            level: character.level,
            description: character.description,
            stats: character.stats,
            updatedBy: 'dm',
          };

          // Emitir a todos en la partida
          console.log(`📤 Emitiendo character-updated a game:${gameId}`);
          io.to(`game:${gameId}`).emit('character-updated', updatePayload);

          // También emitir al canal personal del propietario
          const userChannel = `user:${character.playerId}`;
          console.log(
            `📤 Emitiendo character-updated (DM edit) a: ${userChannel}`,
          );
          io.to(userChannel).emit('character-updated', updatePayload);

          console.log(
            `✅ DM actualizó personaje ${character.name}`,
            updatePayload,
          );
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      },
    );

    // DM: Validar/Rechazar personaje
    socket.on(
      'dm:validate-character',
      async ({ characterId, validated, comment, gameId }) => {
        console.log('📥 dm:validate-character recibido:', {
          characterId,
          validated,
          gameId,
        });

        const isAuthorized = await isDM(socket, gameId);
        console.log('🔐 isDM check:', isAuthorized);

        if (!isAuthorized) {
          console.log('❌ No autorizado como DM');
          socket.emit('error', { message: 'No autorizado' });
          return;
        }

        try {
          const character = await Character.findById(characterId);
          if (!character) {
            console.log('❌ Personaje no encontrado:', characterId);
            socket.emit('error', { message: 'Personaje no encontrado' });
            return;
          }

          character.validated = validated;
          character.validationComment = comment || '';
          character.updatedAt = new Date();
          await character.save();

          // Emitir a todos en la partida
          io.to(`game:${gameId}`).emit('character-validated', {
            characterId,
            validated,
            comment: comment || '',
            characterName: character.name,
            updatedBy: 'dm',
          });

          // También emitir al canal personal del propietario del personaje
          const userChannel = `user:${character.playerId}`;
          console.log(
            `📤 Emitiendo character-validated a canal: ${userChannel}`,
          );
          io.to(userChannel).emit('character-validated', {
            characterId,
            validated,
            comment: comment || '',
            characterName: character.name,
            updatedBy: 'dm',
          });

          console.log(
            `✅ Personaje ${character.name} ${validated ? 'aprobado' : 'rechazado'} por el DM`,
          );
        } catch (error) {
          console.log('❌ Error:', error.message);
          socket.emit('error', { message: error.message });
        }
      },
    );

    // DM: Añadir habilidad
    socket.on('dm:add-ability', async ({ characterId, ability, gameId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }
      const character = await Character.findById(characterId);
      if (!character) return;

      console.log(
        `📋 Habilidades ANTES de añadir:`,
        character.abilities.map((a) => a.name),
      );

      const newAbility = {
        ...ability,
        id: `ability_${Date.now()}`,
      };

      character.abilities.push(newAbility);
      character.updatedAt = new Date();
      await character.save();

      // Recargar para verificar que se guardó
      const savedChar = await Character.findById(characterId);
      console.log(
        `📋 Habilidades DESPUÉS de guardar:`,
        savedChar.abilities.map((a) => a.name),
      );

      io.to(`game:${gameId}`).emit('ability-added', {
        characterId,
        ability: newAbility,
        updatedBy: 'dm',
      });

      // También emitir al canal personal del propietario
      io.to(`user:${character.playerId}`).emit('ability-added', {
        characterId,
        ability: newAbility,
        updatedBy: 'dm',
      });

      console.log(
        `✅ Habilidad "${newAbility.name}" añadida a ${character.name}`,
      );
    });

    // DM: Eliminar habilidad
    socket.on(
      'dm:remove-ability',
      async ({ characterId, abilityId, gameId }) => {
        if (!(await isDM(socket, gameId))) {
          socket.emit('error', { message: 'No autorizado' });
          return;
        }
        const character = await Character.findById(characterId);
        if (!character) return;

        character.abilities = character.abilities.filter(
          (a) => a.id !== abilityId,
        );
        character.updatedAt = new Date();
        await character.save();

        io.to(`game:${gameId}`).emit('ability-removed', {
          characterId,
          abilityId,
          updatedBy: 'dm',
        });

        // También emitir al canal personal del propietario
        io.to(`user:${character.playerId}`).emit('ability-removed', {
          characterId,
          abilityId,
          updatedBy: 'dm',
        });
      },
    );

    // DM: Aplicar daño/grupal
    socket.on(
      'dm:apply-damage',
      async ({ targets, damage, damageType, gameId }) => {
        const updates = [];

        for (const characterId of targets) {
          const character = await Character.findById(characterId);
          if (!character) continue;

          const oldHp = character.stats.hp;
          const newHp = Math.max(0, character.stats.hp - damage);
          character.stats.hp = newHp;

          // Registrar cambio pendiente para visualización
          character.pendingChanges = {
            hp: newHp - oldHp,
            mana: 0,
            appliedAt: new Date(),
          };

          // Verificar si queda en aviso de KO
          if (newHp <= 0 && !character.isKO) {
            character.koWarning = true;
          }

          character.updatedAt = new Date();
          await character.save();

          updates.push({
            characterId,
            hp: newHp,
            maxHp: character.stats.maxHp,
            damage,
            damageType,
            hpChange: newHp - oldHp,
            koWarning: character.koWarning,
          });
        }

        io.to(`game:${gameId}`).emit('damage-applied', {
          updates,
          updatedBy: 'dm',
        });

        // También emitir al canal personal de cada personaje afectado
        for (const update of updates) {
          const character = await Character.findById(update.characterId);
          if (character) {
            io.to(`user:${character.playerId}`).emit('damage-applied', {
              updates: [update],
              updatedBy: 'dm',
            });
          }
        }
      },
    );

    // DM/Jugador: Modificar HP directamente (curar o dañar)
    socket.on('modify-hp', async ({ characterId, amount, gameId, reason }) => {
      try {
        const character = await Character.findById(characterId);
        if (!character) {
          socket.emit('error', { message: 'Personaje no encontrado' });
          return;
        }

        const oldHp = character.stats.hp;
        const newHp = Math.min(
          Math.max(0, character.stats.hp + amount),
          character.stats.maxHp,
        );
        character.stats.hp = newHp;

        // Registrar cambio para visualización
        character.pendingChanges = {
          hp: newHp - oldHp,
          mana: character.pendingChanges?.mana || 0,
          appliedAt: new Date(),
        };

        // Manejar KO warning
        if (newHp <= 0 && !character.isKO) {
          character.koWarning = true;
        } else if (newHp > 0) {
          // Si se cura, quitar warnings y KO
          character.koWarning = false;
          if (character.isKO) {
            character.isKO = false;
          }
        }

        character.updatedAt = new Date();
        await character.save();

        io.to(`game:${gameId}`).emit('hp-modified', {
          characterId,
          oldHp,
          newHp,
          maxHp: character.stats.maxHp,
          change: newHp - oldHp,
          reason: reason || (amount > 0 ? 'curación' : 'daño'),
          koWarning: character.koWarning,
          isKO: character.isKO,
        });

        // También emitir al canal personal del propietario
        io.to(`user:${character.playerId}`).emit('hp-modified', {
          characterId,
          oldHp,
          newHp,
          maxHp: character.stats.maxHp,
          change: newHp - oldHp,
          reason: reason || (amount > 0 ? 'curación' : 'daño'),
          koWarning: character.koWarning,
          isKO: character.isKO,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM/Jugador: Modificar Mana directamente
    socket.on(
      'modify-mana',
      async ({ characterId, amount, gameId, reason }) => {
        try {
          const character = await Character.findById(characterId);
          if (!character) {
            socket.emit('error', { message: 'Personaje no encontrado' });
            return;
          }

          const oldMana = character.stats.mana;
          const newMana = Math.min(
            Math.max(0, character.stats.mana + amount),
            character.stats.maxMana,
          );
          character.stats.mana = newMana;

          // Registrar cambio para visualización
          character.pendingChanges = {
            hp: character.pendingChanges?.hp || 0,
            mana: newMana - oldMana,
            appliedAt: new Date(),
          };

          character.updatedAt = new Date();
          await character.save();

          io.to(`game:${gameId}`).emit('mana-modified', {
            characterId,
            oldMana,
            newMana,
            maxMana: character.stats.maxMana,
            change: newMana - oldMana,
            reason: reason || (amount > 0 ? 'recuperación' : 'gasto'),
          });

          // También emitir al canal personal del propietario
          io.to(`user:${character.playerId}`).emit('mana-modified', {
            characterId,
            oldMana,
            newMana,
            maxMana: character.stats.maxMana,
            change: newMana - oldMana,
            reason: reason || (amount > 0 ? 'recuperación' : 'gasto'),
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      },
    );

    // DM: Revivir personaje (quitar estado KO)
    socket.on(
      'dm:revive-character',
      async ({ characterId, hpAmount, gameId }) => {
        if (!(await isDM(socket, gameId))) {
          socket.emit('error', { message: 'No autorizado' });
          return;
        }

        try {
          const character = await Character.findById(characterId);
          if (!character) {
            socket.emit('error', { message: 'Personaje no encontrado' });
            return;
          }

          character.isKO = false;
          character.koWarning = false;
          character.stats.hp = Math.min(hpAmount || 1, character.stats.maxHp);
          character.pendingChanges = {
            hp: character.stats.hp,
            mana: 0,
            appliedAt: new Date(),
          };
          character.updatedAt = new Date();
          await character.save();

          // Actualizar estado KO en el turnOrder del juego
          const game = await Game.findById(gameId);
          if (game) {
            const turnEntry = game.turnOrder.find(
              (t) => t.characterId.toString() === characterId,
            );
            if (turnEntry) {
              turnEntry.isKO = false;
              await game.save();
            }
          }

          io.to(`game:${gameId}`).emit('character-revived', {
            characterId,
            name: character.name,
            hp: character.stats.hp,
            maxHp: character.stats.maxHp,
            updatedBy: 'dm',
          });
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      },
    );

    // DM: Añadir estado (con efectos por turno)
    socket.on('dm:add-status', async ({ characterId, status, gameId }) => {
      const character = await Character.findById(characterId);
      if (!character) return;

      // Estructura completa del estado con efectos
      const newStatus = {
        id: `status_${Date.now()}`,
        type: status.type || 'neutral',
        name: status.name,
        description: status.description || '',
        duration: status.duration,
        icon: status.icon || '',
        effects: {
          hpPerTurn: status.effects?.hpPerTurn || 0,
          manaPerTurn: status.effects?.manaPerTurn || 0,
          statModifiers: {
            strength: status.effects?.statModifiers?.strength || 0,
            intelligence: status.effects?.statModifiers?.intelligence || 0,
            dexterity: status.effects?.statModifiers?.dexterity || 0,
            defense: status.effects?.statModifiers?.defense || 0,
          },
        },
      };

      character.status.push(newStatus);
      character.updatedAt = new Date();
      await character.save();

      io.to(`game:${gameId}`).emit('status-added', {
        characterId,
        status: newStatus,
        updatedBy: 'dm',
      });

      // También emitir al canal personal del propietario
      io.to(`user:${character.playerId}`).emit('status-added', {
        characterId,
        status: newStatus,
        updatedBy: 'dm',
      });
    });

    // DM: Eliminar estado
    socket.on('dm:remove-status', async ({ characterId, statusId, gameId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }
      const character = await Character.findById(characterId);
      if (!character) return;

      character.status = character.status.filter((s) => s.id !== statusId);
      character.updatedAt = new Date();
      await character.save();

      io.to(`game:${gameId}`).emit('status-removed', {
        characterId,
        statusId,
        updatedBy: 'dm',
      });

      // También emitir al canal personal del propietario
      io.to(`user:${character.playerId}`).emit('status-removed', {
        characterId,
        statusId,
        updatedBy: 'dm',
      });
    });

    // Jugador: Actualizar personaje (solo si puede editar)
    socket.on(
      'player:update-character',
      async ({ characterId, updates, gameId }) => {
        const character = await Character.findById(characterId);
        if (!character || !character.canEdit) return;

        // Solo permitir ciertos campos
        const allowedFields = [
          'name',
          'avatar',
          'stats.strength',
          'stats.intelligence',
          'stats.dexterity',
        ];
        const sanitizedUpdates = {};

        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            sanitizedUpdates[field] = updates[field];
          }
        }

        Object.assign(character, sanitizedUpdates);
        character.updatedAt = new Date();
        await character.save();

        io.to(`game:${gameId}`).emit('character-updated', {
          characterId,
          updates: sanitizedUpdates,
          updatedBy: 'player',
        });
      },
    );

    // Jugador: Añadir habilidad a su personaje (solo si puede editar)
    socket.on(
      'player:add-ability',
      async ({ characterId, ability, gameId }) => {
        const character = await Character.findById(characterId);
        if (!character || !character.canEdit) {
          socket.emit('error', { message: 'No puedes editar este personaje' });
          return;
        }

        const newAbility = {
          ...ability,
          id: ability.id || `ability_${Date.now()}`,
        };

        character.abilities.push(newAbility);
        character.updatedAt = new Date();
        await character.save();

        io.to(`game:${gameId}`).emit('ability-added', {
          characterId,
          ability: newAbility,
          updatedBy: 'player',
        });

        io.to(`user:${character.playerId}`).emit('ability-added', {
          characterId,
          ability: newAbility,
          updatedBy: 'player',
        });

        console.log(
          `✅ Jugador añadió habilidad "${newAbility.name}" a ${character.name}`,
        );
      },
    );

    // Jugador: Eliminar habilidad de su personaje (solo si puede editar)
    socket.on(
      'player:remove-ability',
      async ({ characterId, abilityId, gameId }) => {
        const character = await Character.findById(characterId);
        if (!character || !character.canEdit) {
          socket.emit('error', { message: 'No puedes editar este personaje' });
          return;
        }

        character.abilities = character.abilities.filter(
          (a) => a.id !== abilityId,
        );
        character.updatedAt = new Date();
        await character.save();

        io.to(`game:${gameId}`).emit('ability-removed', {
          characterId,
          abilityId,
          updatedBy: 'player',
        });

        io.to(`user:${character.playerId}`).emit('ability-removed', {
          characterId,
          abilityId,
          updatedBy: 'player',
        });

        console.log(`✅ Jugador eliminó habilidad de ${character.name}`);
      },
    );

    // Jugador: Usar habilidad
    socket.on(
      'player:use-ability',
      async ({ characterId, abilityId, gameId }) => {
        const character = await Character.findById(characterId);
        if (!character) return;

        const ability = character.abilities.find((a) => a.id === abilityId);
        if (!ability) return;

        // Verificar coste de mana
        if (character.stats.mana < ability.manaCost) {
          socket.emit('error', { message: 'Mana insuficiente' });
          return;
        }

        // Consumir mana
        character.stats.mana -= ability.manaCost;
        character.updatedAt = new Date();
        await character.save();

        io.to(`game:${gameId}`).emit('ability-used', {
          characterId,
          abilityId,
          mana: character.stats.mana,
          maxMana: character.stats.maxMana,
          updatedBy: 'player',
        });
      },
    );

    // === EVENTOS DE NPCs ===

    // DM: NPC spawneado - notificar a todos
    socket.on('npc:spawned', async ({ gameId, npc }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      io.to(`game:${gameId}`).emit('npc-spawned', {
        npc,
        message: `${npc.name} ha aparecido`,
      });
    });

    // DM: NPC muerto - remover del turno y notificar
    socket.on('npc:killed', async ({ gameId, npcId, loot }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) return;

        // Remover del orden de turnos si está
        const turnIndex = game.turnOrder.findIndex(
          (t) => t.characterId?.toString() === npcId,
        );

        if (turnIndex !== -1) {
          // Si era el turno actual, pasar al siguiente
          if (turnIndex === game.currentTurnIndex) {
            // No avanzar el índice, solo remover
          } else if (turnIndex < game.currentTurnIndex) {
            game.currentTurnIndex = Math.max(0, game.currentTurnIndex - 1);
          }

          game.turnOrder.splice(turnIndex, 1);

          // Reasignar posiciones
          game.turnOrder = game.turnOrder.map((entry, index) => ({
            ...(entry.toObject ? entry.toObject() : entry),
            position: index,
          }));

          // Ajustar índice si es necesario
          if (game.currentTurnIndex >= game.turnOrder.length) {
            game.currentTurnIndex = 0;
          }

          await game.save();
        }

        const npc = await Character.findById(npcId);

        io.to(`game:${gameId}`).emit('npc-killed', {
          npcId,
          npcName: npc?.name || 'NPC',
          loot,
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // DM: NPC eliminado (sin loot)
    socket.on('npc:deleted', async ({ gameId, npcId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }

      try {
        const game = await Game.findById(gameId);
        if (!game) return;

        // Remover del orden de turnos si está
        const turnIndex = game.turnOrder.findIndex(
          (t) => t.characterId?.toString() === npcId,
        );

        if (turnIndex !== -1) {
          if (turnIndex < game.currentTurnIndex) {
            game.currentTurnIndex = Math.max(0, game.currentTurnIndex - 1);
          }

          game.turnOrder.splice(turnIndex, 1);

          game.turnOrder = game.turnOrder.map((entry, index) => ({
            ...(entry.toObject ? entry.toObject() : entry),
            position: index,
          }));

          if (game.currentTurnIndex >= game.turnOrder.length) {
            game.currentTurnIndex = 0;
          }

          await game.save();
        }

        io.to(`game:${gameId}`).emit('npc-deleted', {
          npcId,
          turnOrder: game.turnOrder,
          currentTurnIndex: game.currentTurnIndex,
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Usuario desconectado:', socket.id);

      // Limpiar rate limiter para este socket
      socketRateLimiter.removeClient(socket.id);

      // Remover todos los listeners para prevenir memory leaks
      socket.removeAllListeners();
    });
  });
};

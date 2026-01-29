import { verifyToken } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { Game } from '../models/Game.js';

// Función para calcular iniciativa basada en dexterity
const calculateInitiative = (characters) => {
  return characters
    .map((char) => ({
      characterId: char._id,
      name: char.name,
      initiative: char.stats?.dexterity || 1,
    }))
    .sort((a, b) => b.initiative - a.initiative) // Mayor dexterity primero
    .map((entry, index) => ({ ...entry, position: index }));
};

// Función para encontrar grupos de empate
const findTiedGroups = (turnOrder) => {
  const groups = [];
  let currentGroup = [];
  let currentInitiative = null;

  for (const entry of turnOrder) {
    if (currentInitiative === null || entry.initiative === currentInitiative) {
      currentGroup.push(entry);
      currentInitiative = entry.initiative;
    } else {
      if (currentGroup.length > 1) {
        groups.push({
          initiative: currentInitiative,
          characters: currentGroup,
        });
      }
      currentGroup = [entry];
      currentInitiative = entry.initiative;
    }
  }

  // Verificar el último grupo
  if (currentGroup.length > 1) {
    groups.push({
      initiative: currentInitiative,
      characters: currentGroup,
    });
  }

  return groups;
};

export const setupGameSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('🎮 Usuario conectado:', socket.id);
    const isDM = async (socket, gameId) => {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      const game = await Game.findById(gameId);
      return game.dmId.toString() === user.sub;
    };

    // --- ORDEN DE TURNOS ---

    // DM: Calcular orden de turnos basado en dexterity
    socket.on('dm:calculate-turn-order', async ({ gameId }) => {
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

        // Obtener todos los personajes de la partida
        const characterIds = game.players
          .filter((p) => p.characterId)
          .map((p) => p.characterId);

        const characters = await Character.find({ _id: { $in: characterIds } });

        // Calcular iniciativa
        const turnOrder = calculateInitiative(characters);

        // Guardar en la partida
        game.turnOrder = turnOrder;
        game.currentTurnIndex = 0;
        game.combatStarted = true;
        await game.save();

        // Encontrar empates
        const tiedGroups = findTiedGroups(turnOrder);

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

        // Verificar que ninguno de los personajes a reordenar tenga el turno actual
        const currentTurnCharId =
          game.turnOrder[game.currentTurnIndex]?.characterId?.toString();
        const reorderingCurrentTurn = reorderedCharacters.some(
          (char) => char.characterId.toString() === currentTurnCharId,
        );

        if (reorderingCurrentTurn) {
          socket.emit('error', {
            message:
              'No puedes cambiar el orden del personaje que tiene el turno actual',
          });
          return;
        }

        // Actualizar las posiciones de los personajes reordenados
        for (const reordered of reorderedCharacters) {
          const index = game.turnOrder.findIndex(
            (t) =>
              t.characterId.toString() === reordered.characterId.toString(),
          );
          if (index !== -1) {
            game.turnOrder[index].position = reordered.newPosition;
          }
        }

        // Reordenar el array según las nuevas posiciones
        game.turnOrder.sort((a, b) => a.position - b.position);

        // Reasignar posiciones secuenciales
        game.turnOrder = game.turnOrder.map((entry, index) => ({
          ...(entry.toObject ? entry.toObject() : entry),
          position: index,
        }));

        await game.save();

        // Encontrar empates restantes
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
        await game.save();

        io.to(`game:${gameId}`).emit('turn-advanced', {
          currentTurnIndex: game.currentTurnIndex,
          currentCharacter: game.turnOrder[game.currentTurnIndex],
          updatedBy: 'dm',
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
    });

    // DM: Añadir habilidad
    socket.on('dm:add-ability', async ({ characterId, ability, gameId }) => {
      if (!(await isDM(socket, gameId))) {
        socket.emit('error', { message: 'No autorizado' });
        return;
      }
      const character = await Character.findById(characterId);
      if (!character) return;

      character.abilities.push({
        ...ability,
        id: `ability_${Date.now()}`,
      });
      character.updatedAt = new Date();
      await character.save();

      io.to(`game:${gameId}`).emit('ability-added', {
        characterId,
        ability,
        updatedBy: 'dm',
      });
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

          const newHp = Math.max(0, character.stats.hp - damage);
          character.stats.hp = newHp;
          character.updatedAt = new Date();
          await character.save();

          updates.push({
            characterId,
            hp: newHp,
            maxHp: character.stats.maxHp,
            damage,
            damageType,
          });
        }

        io.to(`game:${gameId}`).emit('damage-applied', {
          updates,
          updatedBy: 'dm',
        });
      },
    );

    // DM: Añadir estado
    socket.on('dm:add-status', async ({ characterId, status, gameId }) => {
      const character = await Character.findById(characterId);
      if (!character) return;

      character.status.push({
        ...status,
        id: `status_${Date.now()}`,
      });
      character.updatedAt = new Date();
      await character.save();

      io.to(`game:${gameId}`).emit('status-added', {
        characterId,
        status,
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

    socket.on('disconnect', () => {
      console.log('❌ Usuario desconectado:', socket.id);
    });
  });
};

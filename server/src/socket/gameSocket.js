// --- ORDEN DE TURNOS ---
// DM: Actualizar el orden de turnos
socket.on('dm:update-turn-order', async ({ gameId, turnOrder }) => {
  if (!(await isDM(socket, gameId))) {
    socket.emit('error', { message: 'No autorizado' });
    return;
  }
  // Guardar el orden de turnos en memoria o en la base de datos según tu modelo
  // Aquí solo se emite a todos los jugadores de la partida
  io.to(`game:${gameId}`).emit('turn-order-updated', {
    turnOrder,
    updatedBy: 'dm',
  });
});

// DM: Avanzar turno
socket.on('dm:next-turn', async ({ gameId }) => {
  // Aquí deberías tener la lógica para avanzar el turno en el backend
  // Por simplicidad, solo se emite el evento (el cliente debe enviar el nuevo orden o el índice actual)
  io.to(`game:${gameId}`).emit('turn-next', {
    updatedBy: 'dm',
  });
});

// DM: Forzar turno a un personaje específico
socket.on('dm:force-turn', async ({ gameId, characterId }) => {
  io.to(`game:${gameId}`).emit('turn-forced', {
    characterId,
    updatedBy: 'dm',
  });
});
import { Character } from '../models/Character.js';

export const setupGameSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('🎮 Usuario conectado:', socket.id);
    const isDM = async (socket, gameId) => {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      const game = await Game.findById(gameId);
      return game.dmId.toString() === user.sub;
    };

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

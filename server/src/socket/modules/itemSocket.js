// Módulo de handlers de socket para items
import { Character } from '../../models/Character.js';
import { User } from '../../models/User.js';

export function setupItemSocket(io, socket) {
  // Consumir item del inventario
  socket.on(
    'player:consume-item',
    async ({ characterId, inventoryId, gameId }) => {
      try {
        const character = await Character.findById(characterId);
        if (!character) {
          socket.emit('error', { message: 'Personaje no encontrado' });
          return;
        }
        // Buscar item en inventario
        const item = character.inventory.find((inv) => inv.id === inventoryId);
        if (!item) {
          socket.emit('error', { message: 'Item no encontrado en inventario' });
          return;
        }
        if (item.type !== 'consumable' || !item.useEffect) {
          socket.emit('error', { message: 'El item no es consumible' });
          return;
        }
        // Aplicar efecto
        let effectMsg = '';
        if (item.useEffect.type === 'heal') {
          character.stats.hp = Math.min(
            character.stats.maxHp,
            character.stats.hp + item.useEffect.value,
          );
          effectMsg = `+${item.useEffect.value} HP`;
        } else if (item.useEffect.type === 'mana') {
          character.stats.mana = Math.min(
            character.stats.maxMana,
            character.stats.mana + item.useEffect.value,
          );
          effectMsg = `+${item.useEffect.value} MP`;
        }
        // Descontar cantidad
        item.quantity = (item.quantity || 1) - 1;
        if (item.quantity <= 0) {
          character.inventory = character.inventory.filter(
            (inv) => inv.id !== inventoryId,
          );
        }
        character.updatedAt = new Date();
        await character.save();
        // Notificar al DM
        const user = await User.findById(character.playerId);
        io.to(`game:${gameId}`).emit('dm:item-consumed', {
          characterId,
          playerName: user?.name || 'Jugador',
          itemName: item.name,
          effect: effectMsg,
          gameId,
        });
        // Actualizar inventario al jugador
        io.to(`user:${character.playerId}`).emit('inventory-updated', {
          characterId,
          inventory: character.inventory,
          stats: character.stats,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    },
  );
}

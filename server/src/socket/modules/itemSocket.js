// Módulo de handlers de socket para items
import { Character } from '../../models/Character.js';
import { User } from '../../models/User.js';

export function setupItemSocket(io, socket) {
  // Consumir item del inventario
  socket.on(
    'player:consume-item',
    async ({ characterId, inventoryId, gameId }) => {
      console.log('🎯 [itemSocket] Evento player:consume-item recibido:', {
        characterId,
        inventoryId,
        gameId,
        socketId: socket.id,
      });
      try {
        const character = await Character.findById(characterId);
        if (!character) {
          console.log('❌ Personaje no encontrado:', characterId);
          socket.emit('error', { message: 'Personaje no encontrado' });
          return;
        }
        // Buscar item en inventario
        console.log('🔍 Buscando item en inventario:', {
          inventoryId,
          inventoryLength: character.inventory.length,
          inventoryIds: character.inventory.map((i) => i.id),
        });
        const item = character.inventory.find((inv) => inv.id === inventoryId);
        if (!item) {
          console.log('❌ Item no encontrado en inventario');
          socket.emit('error', { message: 'Item no encontrado en inventario' });
          return;
        }

        // Poblar datos del item base si tiene itemRef
        let itemData = item;
        if (item.itemRef) {
          const { Item } = await import('../../models/Item.js');
          const baseItem = await Item.findById(item.itemRef).lean();
          if (baseItem) {
            // Fusionar datos del item base con los del inventario
            itemData = {
              ...baseItem,
              ...item.toObject(),
              useEffect: baseItem.useEffect || item.useEffect || null,
            };
            console.log('✅ Item poblado desde itemRef:', {
              name: itemData.name,
              hasUseEffect: !!itemData.useEffect,
              useEffect: itemData.useEffect,
            });
          }
        }

        console.log('✅ Item encontrado:', {
          name: itemData.name,
          type: itemData.type,
          hasUseEffect: !!itemData.useEffect,
          useEffect: itemData.useEffect,
        });
        if (itemData.type !== 'consumable' || !itemData.useEffect) {
          console.log('❌ El item no es consumible o no tiene useEffect');
          socket.emit('error', { message: 'El item no es consumible' });
          return;
        }
        // Aplicar efecto
        let effectMsg = '';
        if (itemData.useEffect.type === 'heal') {
          const oldHp = character.stats.hp;
          character.stats.hp = Math.min(
            character.stats.maxHp,
            character.stats.hp + itemData.useEffect.value,
          );
          effectMsg = `+${itemData.useEffect.value} HP`;
          console.log(`💚 Curación aplicada: ${oldHp} → ${character.stats.hp}`);
        } else if (itemData.useEffect.type === 'mana') {
          const oldMana = character.stats.mana;
          character.stats.mana = Math.min(
            character.stats.maxMana,
            character.stats.mana + itemData.useEffect.value,
          );
          effectMsg = `+${itemData.useEffect.value} MP`;
          console.log(
            `💙 Maná restaurado: ${oldMana} → ${character.stats.mana}`,
          );
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

        console.log('💾 Personaje guardado con stats actualizadas:', {
          hp: character.stats.hp,
          mana: character.stats.mana,
        });

        // Poblar inventario antes de enviar (para incluir useEffect y otros campos)
        const { Item } = await import('../../models/Item.js');
        const allItemRefs = new Set();
        character.inventory.forEach((invItem) => {
          if (invItem.itemRef) allItemRefs.add(invItem.itemRef.toString());
        });

        let itemDataMap = {};
        if (allItemRefs.size > 0) {
          const items = await Item.find({
            _id: { $in: Array.from(allItemRefs) },
          }).lean();
          itemDataMap = items.reduce((acc, baseItem) => {
            acc[baseItem._id.toString()] = baseItem;
            return acc;
          }, {});
        }

        // Fusionar datos de items base con inventario
        const populatedInventory = character.inventory.map((invItem) => {
          if (invItem.itemRef && itemDataMap[invItem.itemRef.toString()]) {
            const base = itemDataMap[invItem.itemRef.toString()];
            return {
              ...base,
              ...invItem.toObject(),
              useEffect: base.useEffect || invItem.useEffect || null,
            };
          }
          return invItem.toObject ? invItem.toObject() : invItem;
        });

        console.log('📦 Inventario poblado para enviar:', {
          itemsCount: populatedInventory.length,
          hasUseEffect: populatedInventory.map((i) => ({
            name: i.name,
            hasUseEffect: !!i.useEffect,
          })),
        });

        // Notificar al DM
        const user = await User.findById(character.playerId);
        io.to(`game:${gameId}`).emit('dm:item-consumed', {
          characterId,
          playerName: user?.name || 'Jugador',
          itemName: itemData.name,
          effect: effectMsg,
          gameId,
        });
        // Actualizar inventario al jugador
        console.log('📡 Enviando inventory-updated con stats:', {
          characterId,
          playerId: character.playerId,
          stats: character.stats,
        });
        io.to(`user:${character.playerId}`).emit('inventory-updated', {
          characterId,
          inventory: populatedInventory,
          stats: character.stats,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    },
  );
}

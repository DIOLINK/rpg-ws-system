import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { Game } from '../models/Game.js';
import { Item } from '../models/Item.js';

// Verificar si el usuario es DM de la partida
const isDMOfGame = async (userId, gameId) => {
  if (!userId || !gameId) return false;
  const game = await Game.findById(gameId);
  if (!game || !game.dmId) return false;
  return game.dmId.toString() === userId.toString();
};

// Factory function para crear las rutas con acceso a io
export const createItemRoutes = (io) => {
  const router = express.Router();

  // Helper para emitir actualización de inventario
  const emitInventoryUpdate = (
    character,
    gameId,
    itemData,
    action = 'added',
  ) => {
    const payload = {
      characterId: character._id,
      inventory: character.inventory,
      gold: character.gold,
      itemData,
      action,
      timestamp: new Date(),
    };

    // Emitir a la sala del juego (para DM y otros jugadores)
    if (gameId) {
      console.log(`📦 Emitiendo inventory-updated a game:${gameId}`);
      io.to(`game:${gameId}`).emit('inventory-updated', payload);
    }

    // Emitir al canal personal del dueño del personaje
    if (character.playerId) {
      const userChannel = `user:${character.playerId}`;
      console.log(`📦 Emitiendo inventory-updated a ${userChannel}`);
      io.to(userChannel).emit('inventory-updated', payload);
    }

    // También emitir como character-updated para compatibilidad
    const charPayload = {
      characterId: character._id,
      _id: character._id,
      inventory: character.inventory,
      gold: character.gold,
    };

    if (gameId) {
      io.to(`game:${gameId}`).emit('character-updated', charPayload);
    }
    if (character.playerId) {
      io.to(`user:${character.playerId}`).emit(
        'character-updated',
        charPayload,
      );
    }
  };

  // ============ CRUD DE ITEMS ============

  // Obtener todos los items (del sistema + custom del usuario)
  router.get('/', authenticateUser, async (req, res) => {
    try {
      const items = await Item.find({
        $or: [{ isCustom: false }, { createdBy: req.user._id }],
      }).sort({ type: 1, rarity: 1, name: 1 });

      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Obtener un item por ID
  router.get('/:id', authenticateUser, async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Crear un nuevo item (solo DM)
  router.post('/', authenticateUser, async (req, res) => {
    try {
      const item = new Item({
        ...req.body,
        createdBy: req.user._id,
        isCustom: true,
      });

      await item.save();
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Actualizar un item (solo el creador)
  router.put('/:id', authenticateUser, async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }

      if (
        item.isCustom &&
        item.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (!item.isCustom) {
        return res
          .status(403)
          .json({ error: 'No se pueden editar items del sistema' });
      }

      Object.assign(item, req.body);
      await item.save();

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Eliminar un item (solo el creador)
  router.delete('/:id', authenticateUser, async (req, res) => {
    try {
      const item = await Item.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }

      if (
        item.isCustom &&
        item.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (!item.isCustom) {
        return res
          .status(403)
          .json({ error: 'No se pueden eliminar items del sistema' });
      }

      await Item.findByIdAndDelete(req.params.id);
      res.json({ message: 'Item eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ ASIGNACIÓN DE ITEMS ============

  // Asignar item a un personaje
  router.post('/assign/:characterId', authenticateUser, async (req, res) => {
    try {
      const { itemId, quantity = 1, gameId } = req.body;

      if (gameId && !(await isDMOfGame(req.user._id, gameId))) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const character = await Character.findById(req.params.characterId);
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' });
      }

      let itemData;

      if (itemId) {
        const item = await Item.findById(itemId);
        if (!item) {
          return res.status(404).json({ error: 'Item no encontrado' });
        }

        itemData = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          itemRef: item._id,
          name: item.name,
          description: item.description || '',
          quantity,
          type: item.type || 'misc',
          rarity: item.rarity || 'common',
          icon: item.icon || '📦',
          statModifiers: {
            strength: item.statModifiers?.strength || 0,
            intelligence: item.statModifiers?.intelligence || 0,
            dexterity: item.statModifiers?.dexterity || 0,
            defense: item.statModifiers?.defense || 0,
            maxHp: item.statModifiers?.maxHp || 0,
            maxMana: item.statModifiers?.maxMana || 0,
          },
          damage: item.damage || '',
          equippable: item.equippable || false,
          equipSlot: item.equipSlot || '',
          value: item.value || 0,
          equipped: false,
        };
      } else {
        itemData = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...req.body.item,
          quantity,
          equipped: false,
        };
      }

      if (!itemData || !itemData.name) {
        return res.status(400).json({ error: 'Datos del item inválidos' });
      }

      const existingItem = character.inventory.find(
        (inv) =>
          (itemId && inv.itemRef?.toString() === itemId.toString()) ||
          inv.name === itemData.name,
      );

      if (existingItem && itemData.type !== 'quest') {
        existingItem.quantity += quantity;
      } else {
        character.inventory.push(itemData);
      }

      character.updatedAt = new Date();
      await character.save();

      // Emitir evento de actualización de inventario
      emitInventoryUpdate(character, gameId, itemData, 'added');

      res.json({
        message: 'Item asignado correctamente',
        character,
        item: itemData,
      });
    } catch (error) {
      console.error('Error al asignar item:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Asignar item a múltiples personajes
  router.post('/assign-bulk', authenticateUser, async (req, res) => {
    try {
      const {
        itemId,
        characterIds,
        quantity = 1,
        gameId,
        item: customItem,
      } = req.body;

      if (gameId && !(await isDMOfGame(req.user._id, gameId))) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      if (!characterIds || characterIds.length === 0) {
        return res
          .status(400)
          .json({ error: 'Debe seleccionar al menos un personaje' });
      }

      let itemTemplate;

      if (itemId) {
        const item = await Item.findById(itemId);
        if (!item) {
          return res.status(404).json({ error: 'Item no encontrado' });
        }
        itemTemplate = item;
      }

      const results = [];

      for (const characterId of characterIds) {
        const character = await Character.findById(characterId);
        if (!character) continue;

        let itemData;

        if (itemTemplate) {
          itemData = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemRef: itemTemplate._id,
            name: itemTemplate.name,
            description: itemTemplate.description || '',
            quantity,
            type: itemTemplate.type || 'misc',
            rarity: itemTemplate.rarity || 'common',
            icon: itemTemplate.icon || '📦',
            statModifiers: {
              strength: itemTemplate.statModifiers?.strength || 0,
              intelligence: itemTemplate.statModifiers?.intelligence || 0,
              dexterity: itemTemplate.statModifiers?.dexterity || 0,
              defense: itemTemplate.statModifiers?.defense || 0,
              maxHp: itemTemplate.statModifiers?.maxHp || 0,
              maxMana: itemTemplate.statModifiers?.maxMana || 0,
            },
            damage: itemTemplate.damage || '',
            equippable: itemTemplate.equippable || false,
            equipSlot: itemTemplate.equipSlot || '',
            value: itemTemplate.value || 0,
            equipped: false,
          };
        } else if (customItem) {
          itemData = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...customItem,
            quantity,
            equipped: false,
          };
        }

        if (!itemData || !itemData.name) continue;

        const existingItem = character.inventory.find(
          (inv) =>
            (itemId && inv.itemRef?.toString() === itemId.toString()) ||
            inv.name === itemData.name,
        );

        if (existingItem && itemData.type !== 'quest') {
          existingItem.quantity += quantity;
        } else {
          character.inventory.push(itemData);
        }

        character.updatedAt = new Date();
        await character.save();

        // Emitir evento de actualización de inventario para cada personaje
        emitInventoryUpdate(character, gameId, itemData, 'added');

        results.push({
          characterId,
          characterName: character.name,
          item: itemData,
        });
      }

      res.json({
        message: `Item asignado a ${results.length} personajes`,
        results,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quitar item de un personaje
  router.delete(
    '/remove/:characterId/:inventoryId',
    authenticateUser,
    async (req, res) => {
      try {
        const { gameId, quantity } = req.body;

        if (gameId && !(await isDMOfGame(req.user._id, gameId))) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        const character = await Character.findById(req.params.characterId);
        if (!character) {
          return res.status(404).json({ error: 'Personaje no encontrado' });
        }

        const itemIndex = character.inventory.findIndex(
          (inv) => inv.id === req.params.inventoryId,
        );

        if (itemIndex === -1) {
          return res
            .status(404)
            .json({ error: 'Item no encontrado en el inventario' });
        }

        const removedItem = { ...character.inventory[itemIndex] };

        if (quantity && character.inventory[itemIndex].quantity > quantity) {
          character.inventory[itemIndex].quantity -= quantity;
        } else {
          const item = character.inventory[itemIndex];
          if (item.equipped && item.equipSlot) {
            character.equipment[item.equipSlot] = null;
          }
          character.inventory.splice(itemIndex, 1);
        }

        character.updatedAt = new Date();
        await character.save();

        // Emitir evento de actualización de inventario
        emitInventoryUpdate(character, gameId, removedItem, 'removed');

        res.json({
          message: 'Item eliminado del inventario',
          character,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Modificar oro de un personaje
  router.post('/gold/:characterId', authenticateUser, async (req, res) => {
    try {
      const { amount, gameId } = req.body;

      if (gameId && !(await isDMOfGame(req.user._id, gameId))) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const character = await Character.findById(req.params.characterId);
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' });
      }

      character.gold = Math.max(0, (character.gold || 0) + amount);
      character.updatedAt = new Date();
      await character.save();

      // Emitir evento de actualización de oro
      emitInventoryUpdate(
        character,
        gameId,
        { type: 'gold', amount },
        'gold-changed',
      );

      res.json({
        message: amount > 0 ? 'Oro añadido' : 'Oro quitado',
        gold: character.gold,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ EQUIPAMIENTO DE ITEMS ============

  // Equipar un item (jugador)
  router.post(
    '/equip/:characterId/:inventoryId',
    authenticateUser,
    async (req, res) => {
      try {
        const { gameId } = req.body;
        const character = await Character.findById(req.params.characterId);

        if (!character) {
          return res.status(404).json({ error: 'Personaje no encontrado' });
        }

        // Verificar que el usuario es dueño del personaje o DM
        const isOwner =
          character.playerId.toString() === req.user._id.toString();
        const isDM = gameId && (await isDMOfGame(req.user._id, gameId));

        if (!isOwner && !isDM) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        const itemIndex = character.inventory.findIndex(
          (inv) => inv.id === req.params.inventoryId,
        );

        if (itemIndex === -1) {
          return res
            .status(404)
            .json({ error: 'Item no encontrado en el inventario' });
        }

        const item = character.inventory[itemIndex];

        if (!item.equippable) {
          return res
            .status(400)
            .json({ error: 'Este item no se puede equipar' });
        }

        if (!item.equipSlot) {
          return res
            .status(400)
            .json({ error: 'El item no tiene slot de equipo definido' });
        }

        // Contar items equipados actualmente
        const equippedCount = character.inventory.filter(
          (inv) => inv.equipped,
        ).length;

        // Verificar límite de 5 items equipados (si el item actual no está equipado)
        if (!item.equipped && equippedCount >= 5) {
          return res
            .status(400)
            .json({ error: 'No puedes equipar más de 5 items' });
        }

        // Si hay otro item en el mismo slot, desequiparlo
        const currentEquippedId = character.equipment[item.equipSlot];
        if (currentEquippedId && currentEquippedId !== item.id) {
          const currentEquipped = character.inventory.find(
            (inv) => inv.id === currentEquippedId,
          );
          if (currentEquipped) {
            currentEquipped.equipped = false;
          }
        }

        let equippedItem = item;

        // Si el item tiene cantidad > 1, separar 1 unidad para equipar
        if (item.quantity > 1) {
          // Reducir cantidad del stack original
          item.quantity -= 1;

          // Crear nuevo item equipado con cantidad 1
          const newEquippedItem = {
            ...(item.toObject ? item.toObject() : { ...item }),
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            quantity: 1,
            equipped: true,
          };

          character.inventory.push(newEquippedItem);
          equippedItem = newEquippedItem;
        } else {
          // Si solo hay 1, equipar directamente
          item.equipped = true;
        }

        character.equipment[item.equipSlot] = equippedItem.id;
        character.updatedAt = new Date();
        await character.save();

        // Emitir evento
        emitInventoryUpdate(character, gameId, equippedItem, 'equipped');

        res.json({
          message: `${equippedItem.name} equipado`,
          character,
          item: equippedItem,
        });
      } catch (error) {
        console.error('Error al equipar item:', error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Desequipar un item (jugador)
  router.post(
    '/unequip/:characterId/:inventoryId',
    authenticateUser,
    async (req, res) => {
      try {
        const { gameId } = req.body;
        const character = await Character.findById(req.params.characterId);

        if (!character) {
          return res.status(404).json({ error: 'Personaje no encontrado' });
        }

        // Verificar que el usuario es dueño del personaje o DM
        const isOwner =
          character.playerId.toString() === req.user._id.toString();
        const isDM = gameId && (await isDMOfGame(req.user._id, gameId));

        if (!isOwner && !isDM) {
          return res.status(403).json({ error: 'No autorizado' });
        }

        const item = character.inventory.find(
          (inv) => inv.id === req.params.inventoryId,
        );

        if (!item) {
          return res
            .status(404)
            .json({ error: 'Item no encontrado en el inventario' });
        }

        if (!item.equipped) {
          return res.status(400).json({ error: 'El item no está equipado' });
        }

        // Desequipar
        item.equipped = false;
        if (item.equipSlot && character.equipment[item.equipSlot] === item.id) {
          character.equipment[item.equipSlot] = null;
        }

        character.updatedAt = new Date();
        await character.save();

        // Emitir evento
        emitInventoryUpdate(character, gameId, item, 'unequipped');

        res.json({
          message: `${item.name} desequipado`,
          character,
          item,
        });
      } catch (error) {
        console.error('Error al desequipar item:', error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // ============ SISTEMA DE VENTA ============

  // Solicitar venta de un item (jugador -> DM debe aprobar)
  router.post(
    '/sell-request/:characterId/:inventoryId',
    authenticateUser,
    async (req, res) => {
      try {
        const { gameId, quantity = 1 } = req.body;
        const character = await Character.findById(req.params.characterId);

        if (!character) {
          return res.status(404).json({ error: 'Personaje no encontrado' });
        }

        // Solo el dueño puede solicitar venta
        if (character.playerId.toString() !== req.user._id.toString()) {
          return res
            .status(403)
            .json({ error: 'Solo el dueño del personaje puede vender items' });
        }

        const item = character.inventory.find(
          (inv) => inv.id === req.params.inventoryId,
        );

        if (!item) {
          return res
            .status(404)
            .json({ error: 'Item no encontrado en el inventario' });
        }

        if (item.equipped) {
          return res
            .status(400)
            .json({ error: 'Desequipa el item antes de venderlo' });
        }

        if (item.type === 'quest') {
          return res
            .status(400)
            .json({ error: 'No puedes vender items de misión' });
        }

        const sellQuantity = Math.min(quantity, item.quantity);
        const sellValue = (item.value || 0) * sellQuantity;

        if (sellValue <= 0) {
          return res
            .status(400)
            .json({ error: 'Este item no tiene valor de venta' });
        }

        // Obtener el juego para notificar al DM
        const game = await Game.findById(gameId || character.gameId);
        if (!game) {
          return res.status(404).json({ error: 'Partida no encontrada' });
        }

        // Emitir solicitud de venta al DM
        const sellRequest = {
          id: `sell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          characterId: character._id,
          characterName: character.name,
          playerId: character.playerId,
          inventoryId: item.id,
          itemName: item.name,
          itemIcon: item.icon || '📦',
          quantity: sellQuantity,
          totalValue: sellValue,
          unitValue: item.value || 0,
          timestamp: new Date(),
        };

        // Emitir al DM
        const dmChannel = `user:${game.dmId}`;
        console.log(`💰 Enviando solicitud de venta al DM: ${dmChannel}`);
        io.to(dmChannel).emit('sell-request', sellRequest);

        // También al canal del juego para que el DM lo vea si está en la partida
        io.to(`game:${game._id}`).emit('sell-request', sellRequest);

        res.json({
          message: 'Solicitud de venta enviada al DM',
          sellRequest,
        });
      } catch (error) {
        console.error('Error al solicitar venta:', error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // DM responde a solicitud de venta
  router.post('/sell-response', authenticateUser, async (req, res) => {
    try {
      const {
        characterId,
        inventoryId,
        quantity,
        totalValue,
        approved,
        gameId,
      } = req.body;

      // Verificar que es DM
      if (!(await isDMOfGame(req.user._id, gameId))) {
        return res
          .status(403)
          .json({ error: 'Solo el DM puede aprobar ventas' });
      }

      const character = await Character.findById(characterId);
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' });
      }

      const itemIndex = character.inventory.findIndex(
        (inv) => inv.id === inventoryId,
      );
      if (itemIndex === -1) {
        // Notificar al jugador que el item ya no existe
        io.to(`user:${character.playerId}`).emit('sell-response', {
          approved: false,
          reason: 'El item ya no existe en el inventario',
          characterId,
        });
        return res.status(404).json({ error: 'Item no encontrado' });
      }

      const item = character.inventory[itemIndex];

      if (approved) {
        // Procesar la venta
        if (item.quantity <= quantity) {
          // Eliminar item completamente
          character.inventory.splice(itemIndex, 1);
        } else {
          // Reducir cantidad
          item.quantity -= quantity;
        }

        // Añadir oro
        character.gold = (character.gold || 0) + totalValue;
        character.updatedAt = new Date();
        await character.save();

        // Notificar al jugador
        const playerChannel = `user:${character.playerId}`;
        console.log(
          `✅ Emitiendo sell-response (aprobado) a: ${playerChannel}`,
        );
        io.to(playerChannel).emit('sell-response', {
          approved: true,
          itemName: item.name,
          quantity,
          totalValue,
          newGold: character.gold,
          characterId,
        });

        // Actualizar inventario para todos
        emitInventoryUpdate(character, gameId, item, 'sold');

        res.json({
          message: `Venta aprobada: ${item.name} x${quantity} por ${totalValue} oro`,
          character,
        });
      } else {
        // Rechazar venta
        const playerChannel = `user:${character.playerId}`;
        console.log(
          `❌ Emitiendo sell-response (rechazado) a: ${playerChannel}`,
        );
        io.to(playerChannel).emit('sell-response', {
          approved: false,
          itemName: item.name,
          reason: 'El DM ha rechazado la venta',
          characterId,
        });

        res.json({
          message: 'Venta rechazada',
        });
      }
    } catch (error) {
      console.error('Error al procesar respuesta de venta:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============ SISTEMA DE VENTA DEL DM A JUGADORES ============

  // DM ofrece vender items a un jugador (soporta múltiples items)
  router.post('/shop-offer', authenticateUser, async (req, res) => {
    try {
      const { items, characterId, gameId } = req.body;
      // items = [{itemId, quantity, price}]

      // Verificar que es DM
      if (!(await isDMOfGame(req.user._id, gameId))) {
        return res
          .status(403)
          .json({ error: 'Solo el DM puede ofrecer items en venta' });
      }

      // Obtener el personaje
      const character = await Character.findById(characterId);
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' });
      }

      // Obtener todos los items del catálogo
      const itemIds = items.map((i) => i.itemId);
      const catalogItems = await Item.find({ _id: { $in: itemIds } });

      if (catalogItems.length !== items.length) {
        return res
          .status(404)
          .json({ error: 'Algunos items no fueron encontrados' });
      }

      // Construir la oferta con datos completos de cada item
      const offerItems = items.map((reqItem) => {
        const catalogItem = catalogItems.find(
          (ci) => ci._id.toString() === reqItem.itemId,
        );
        return {
          itemId: catalogItem._id,
          itemName: catalogItem.name,
          itemIcon: catalogItem.icon || '📦',
          itemDescription: catalogItem.description,
          itemType: catalogItem.type,
          itemRarity: catalogItem.rarity,
          itemValue: catalogItem.value,
          quantity: reqItem.quantity,
          unitPrice: reqItem.price,
          subtotal: reqItem.quantity * reqItem.price,
        };
      });

      const totalPrice = offerItems.reduce((sum, i) => sum + i.subtotal, 0);

      // Crear oferta de compra
      const shopOffer = {
        id: `shop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        items: offerItems,
        totalPrice,
        characterId: character._id,
        characterName: character.name,
        playerId: character.playerId,
        gameId,
        timestamp: new Date(),
      };

      // Emitir oferta al jugador
      const playerChannel = `user:${character.playerId}`;
      console.log(
        `🏪 Enviando oferta de compra (${offerItems.length} items) a: ${playerChannel}`,
      );
      io.to(playerChannel).emit('shop-offer', shopOffer);

      res.json({
        message: 'Oferta enviada al jugador',
        shopOffer,
      });
    } catch (error) {
      console.error('Error al crear oferta de venta:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Jugador responde a oferta de compra del DM (múltiples items)
  router.post('/shop-response', authenticateUser, async (req, res) => {
    try {
      const { items, characterId, totalPrice, accepted, gameId, offerId } =
        req.body;
      // items = [{itemId, itemName, quantity, ...}]

      const character = await Character.findById(characterId);
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' });
      }

      // Verificar que el usuario es dueño del personaje
      if (character.playerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Obtener el juego para notificar al DM
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Partida no encontrada' });
      }

      const itemSummary = items
        .map((i) => `${i.quantity}x ${i.itemName}`)
        .join(', ');

      if (accepted) {
        // Verificar que tiene suficiente oro
        if ((character.gold || 0) < totalPrice) {
          io.to(`user:${game.dmId}`).emit('shop-response', {
            accepted: false,
            characterName: character.name,
            itemSummary,
            reason: 'No tiene suficiente oro',
          });

          return res.status(400).json({ error: 'No tienes suficiente oro' });
        }

        // Restar oro
        character.gold = (character.gold || 0) - totalPrice;

        // Agregar cada item al inventario
        for (const reqItem of items) {
          const originalItem = await Item.findById(reqItem.itemId);
          if (!originalItem) {
            console.warn(`Item ${reqItem.itemId} no encontrado, saltando...`);
            continue;
          }

          const newInventoryItem = {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            itemRef: originalItem._id,
            name: originalItem.name,
            description: originalItem.description,
            quantity: reqItem.quantity,
            type: originalItem.type,
            rarity: originalItem.rarity,
            icon: originalItem.icon,
            damage: originalItem.damage,
            equippable: originalItem.equippable,
            equipSlot: originalItem.equipSlot,
            equipped: false,
            value: originalItem.value,
            statModifiers: originalItem.statModifiers || {},
          };

          // Buscar si ya tiene el item para stackear
          const existingItem = character.inventory.find(
            (inv) =>
              inv.itemRef?.toString() === originalItem._id.toString() &&
              !inv.equipped,
          );

          if (existingItem && originalItem.stackable !== false) {
            existingItem.quantity += reqItem.quantity;
          } else {
            character.inventory.push(newInventoryItem);
          }
        }

        character.updatedAt = new Date();
        await character.save();

        // Notificar al DM que aceptó
        io.to(`user:${game.dmId}`).emit('shop-response', {
          accepted: true,
          characterName: character.name,
          itemSummary,
          itemCount: items.length,
          totalPrice,
        });

        // Actualizar inventario para todos
        emitInventoryUpdate(character, gameId, null, 'purchased');

        res.json({
          message: `Compra exitosa: ${itemSummary}`,
          character,
          newGold: character.gold,
        });
      } else {
        // Rechazó la compra - notificar al DM
        io.to(`user:${game.dmId}`).emit('shop-response', {
          accepted: false,
          characterName: character.name,
          itemSummary,
          reason: 'El jugador rechazó la oferta',
        });

        res.json({
          message: 'Oferta rechazada',
        });
      }
    } catch (error) {
      console.error('Error al procesar respuesta de compra:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

export default createItemRoutes;

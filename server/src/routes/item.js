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

  return router;
};

export default createItemRoutes;

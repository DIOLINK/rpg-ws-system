import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { Game } from '../models/Game.js';
import { NPCTemplate } from '../models/NPCTemplate.js';

const router = express.Router();

// ===== PLANTILLAS DE NPCs =====

// Obtener todas las plantillas (globales + creadas por el usuario)
router.get('/templates', authenticateUser, async (req, res) => {
  try {
    const templates = await NPCTemplate.find({
      $or: [{ isGlobal: true }, { createdBy: req.user.uid }],
    }).sort({ npcType: 1, name: 1 });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching NPC templates:', error);
    res.status(500).json({ message: 'Error al obtener plantillas de NPC' });
  }
});

// Crear nueva plantilla de NPC
router.post('/templates', authenticateUser, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.uid,
      isGlobal: false, // Las plantillas creadas por usuarios no son globales
    };

    const template = new NPCTemplate(templateData);
    await template.save();

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating NPC template:', error);
    res.status(500).json({ message: 'Error al crear plantilla de NPC' });
  }
});

// Actualizar plantilla
router.put('/templates/:id', authenticateUser, async (req, res) => {
  try {
    const template = await NPCTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Solo puede editar el creador o si es global (admin)
    if (template.createdBy?.toString() !== req.user.uid && !template.isGlobal) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    Object.assign(template, req.body);
    await template.save();

    res.json(template);
  } catch (error) {
    console.error('Error updating NPC template:', error);
    res.status(500).json({ message: 'Error al actualizar plantilla' });
  }
});

// Eliminar plantilla
router.delete('/templates/:id', authenticateUser, async (req, res) => {
  try {
    const template = await NPCTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    // Solo puede eliminar el creador
    if (template.createdBy?.toString() !== req.user.uid) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    await NPCTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    console.error('Error deleting NPC template:', error);
    res.status(500).json({ message: 'Error al eliminar plantilla' });
  }
});

// ===== NPCs EN PARTIDA =====

// Crear NPC en una partida (desde plantilla o personalizado)
router.post('/spawn', authenticateUser, async (req, res) => {
  try {
    const { gameId, templateId, customData } = req.body;

    // Buscar la partida y poblar el DM
    const game = await Game.findById(gameId).populate('dmId');
    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    // game.dmId es un objeto User, comparar googleId
    if (!game.dmId || game.dmId.googleId !== req.user.googleId) {
      return res.status(403).json({ message: 'Solo el DM puede crear NPCs' });
    }

    let npcData = {
      isNPC: true,
      gameId,
      // Si el usuario tiene _id (Mongo), usarlo; si no, usar googleId
      playerId: req.user._id || req.user.uid || req.user.googleId,
      validated: true, // NPCs están validados automáticamente
    };

    // Si viene de plantilla, cargar datos de la plantilla
    if (templateId) {
      const template = await NPCTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Plantilla no encontrada' });
      }

      npcData = {
        ...npcData,
        name: template.name,
        description: template.description,
        classType: template.classType,
        npcIcon: template.icon,
        stats: { ...template.stats },
        abilities: template.abilities.map((a) => ({ ...a.toObject() })),
        inventory: template.inventory.map((item) => ({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          icon: item.icon,
          quantity: item.quantity,
          dropChance: item.dropChance,
          type: 'misc',
          rarity: 'common',
          value: 0,
        })),
        gold: Math.floor(
          Math.random() * (template.goldDrop.max - template.goldDrop.min + 1) +
            template.goldDrop.min,
        ),
        goldDrop: template.goldDrop,
        expReward: template.expReward,
        level: template.level,
        npcType: template.npcType,
        templateId: template._id,
      };
    }

    // Si hay datos personalizados, sobreescribir
    if (customData) {
      npcData = { ...npcData, ...customData };
    }

    const npc = new Character(npcData);
    await npc.save();

    res.status(201).json(npc);
  } catch (error) {
    console.error('Error spawning NPC:', error);
    res.status(500).json({ message: 'Error al crear NPC' });
  }
});

// Obtener NPCs de una partida
router.get('/game/:gameId', authenticateUser, async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verificar que el usuario es el DM o está en la partida
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    const isPlayer = game.players.some((p) => p.odId === req.user.uid);
    const isDM = game.dmId === req.user.uid;

    if (!isDM && !isPlayer) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Si es DM, obtener todos los NPCs
    // Si es jugador, solo obtener NPCs vivos (para mostrar en turnos)
    const query = { gameId, isNPC: true };
    if (!isDM) {
      query.isDead = false;
    }

    const npcs = await Character.find(query);
    res.json(npcs);
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    res.status(500).json({ message: 'Error al obtener NPCs' });
  }
});

// Matar NPC (dropea loot y exp)
router.post('/:npcId/kill', authenticateUser, async (req, res) => {
  try {
    const { npcId } = req.params;
    const { distributeExpTo } = req.body; // Array de characterIds para repartir exp

    const npc = await Character.findById(npcId);
    if (!npc || !npc.isNPC) {
      return res.status(404).json({ message: 'NPC no encontrado' });
    }

    // Verificar que es el DM de la partida
    const game = await Game.findById(npc.gameId);
    if (!game || game.dmId !== req.user.uid) {
      return res.status(403).json({ message: 'Solo el DM puede matar NPCs' });
    }

    // Marcar como muerto
    npc.isDead = true;
    npc.isKO = true;
    npc.stats.hp = 0;
    await npc.save();

    // Calcular loot (items con dropChance)
    const droppedItems = [];
    for (const item of npc.inventory) {
      const dropChance = item.dropChance || 100;
      const roll = Math.random() * 100;
      if (roll <= dropChance) {
        droppedItems.push({
          id: item.id,
          name: item.name,
          icon: item.icon,
          quantity: item.quantity,
          type: item.type,
          rarity: item.rarity,
          value: item.value,
          statModifiers: item.statModifiers,
          damage: item.damage,
          equippable: item.equippable,
          equipSlot: item.equipSlot,
        });
      }
    }

    // Calcular oro dropeado
    const goldDropped = Math.floor(
      Math.random() *
        ((npc.goldDrop?.max || 0) - (npc.goldDrop?.min || 0) + 1) +
        (npc.goldDrop?.min || 0),
    );

    // Distribuir exp si se especifica
    let expDistributed = false;
    if (distributeExpTo && distributeExpTo.length > 0 && npc.expReward > 0) {
      const expPerCharacter = Math.floor(
        npc.expReward / distributeExpTo.length,
      );

      for (const charId of distributeExpTo) {
        const character = await Character.findById(charId);
        if (character && !character.isNPC) {
          // Aquí se podría implementar un sistema de exp/level
          // Por ahora solo notificamos
        }
      }
      expDistributed = true;
    }

    res.json({
      message: `${npc.name} ha muerto`,
      npc: npc,
      loot: {
        items: droppedItems,
        gold: goldDropped,
      },
      exp: npc.expReward,
      expDistributed,
    });
  } catch (error) {
    console.error('Error killing NPC:', error);
    res.status(500).json({ message: 'Error al matar NPC' });
  }
});

// Eliminar NPC completamente
router.delete('/:npcId', authenticateUser, async (req, res) => {
  try {
    const { npcId } = req.params;

    const npc = await Character.findById(npcId);
    if (!npc || !npc.isNPC) {
      return res.status(404).json({ message: 'NPC no encontrado' });
    }

    // Verificar que es el DM de la partida
    const game = await Game.findById(npc.gameId);
    if (!game || game.dmId !== req.user.uid) {
      return res
        .status(403)
        .json({ message: 'Solo el DM puede eliminar NPCs' });
    }

    // Remover del orden de turnos si está
    if (game.turnOrder) {
      game.turnOrder = game.turnOrder.filter(
        (t) => t.characterId?.toString() !== npcId,
      );
      await game.save();
    }

    await Character.findByIdAndDelete(npcId);

    res.json({ message: 'NPC eliminado' });
  } catch (error) {
    console.error('Error deleting NPC:', error);
    res.status(500).json({ message: 'Error al eliminar NPC' });
  }
});

// Dar loot a un personaje específico
router.post('/:npcId/give-loot', authenticateUser, async (req, res) => {
  try {
    const { npcId } = req.params;
    const { characterId, items, gold } = req.body;

    const npc = await Character.findById(npcId);
    if (!npc || !npc.isNPC) {
      return res.status(404).json({ message: 'NPC no encontrado' });
    }

    // Verificar que es el DM
    const game = await Game.findById(npc.gameId);
    if (!game || game.dmId !== req.user.uid) {
      return res.status(403).json({ message: 'Solo el DM puede dar loot' });
    }

    const character = await Character.findById(characterId);
    if (!character) {
      return res.status(404).json({ message: 'Personaje no encontrado' });
    }

    // Dar items
    if (items && items.length > 0) {
      for (const item of items) {
        character.inventory.push({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          description: item.description || '',
          icon: item.icon || '📦',
          quantity: item.quantity || 1,
          type: item.type || 'misc',
          rarity: item.rarity || 'common',
          value: item.value || 0,
          statModifiers: item.statModifiers,
          damage: item.damage,
          equippable: item.equippable,
          equipSlot: item.equipSlot,
        });
      }
    }

    // Dar oro
    if (gold && gold > 0) {
      character.gold = (character.gold || 0) + gold;
    }

    await character.save();

    res.json({
      message: `Loot entregado a ${character.name}`,
      character,
    });
  } catch (error) {
    console.error('Error giving loot:', error);
    res.status(500).json({ message: 'Error al dar loot' });
  }
});

export default router;

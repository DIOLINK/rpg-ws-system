import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { Game } from '../models/Game.js';
import { User } from '../models/User.js';

const router = express.Router();

// Crear partida (solo DM)
router.post('/create', authenticateUser, async (req, res) => {
  try {
    if (!req.user.isDM) {
      return res
        .status(403)
        .json({ error: 'Solo los DM pueden crear partidas' });
    }

    const { name } = req.body;
    const game = await Game.create({
      name,
      dmId: req.user._id,
      players: [],
    });

    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unirse a partida
router.post('/join/:gameId', authenticateUser, async (req, res) => {
  try {
    const { gameId } = req.params;
    let games = [];
    if (gameId.length < 24) {
      // Buscar partidas cuyo _id termine con los caracteres dados
      games = await Game.find({});
      games = games.filter((g) => g._id.toString().endsWith(gameId));
    } else {
      const game = await Game.findById(gameId);
      if (game) games = [game];
    }

    if (games.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontró ninguna partida con ese código.' });
    }
    if (games.length > 1) {
      // Devuelve las partidas encontradas para que el usuario elija
      return res.status(200).json({
        selectGames: games.map((g) => ({
          _id: g._id,
          name: g.name,
          isActive: g.isActive,
          dmId: g.dmId,
          players: g.players,
        })),
      });
    }

    // Unir al usuario a la única partida encontrada (sin personaje)
    const game = games[0];
    // Validar que el usuario no esté ya en la partida
    if (
      game.players.some((p) => p.userId.toString() === req.user._id.toString())
    ) {
      return res.status(400).json({ error: 'Ya estás en esta partida' });
    }
    // Solo agrega el userId, sin characterId
    game.players.push({ userId: req.user._id });
    await game.save();

    res.json({ game });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener las partidas de un usuario
router.get('/my-games', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar partidas donde el usuario sea jugador o DM
    // Usar lean() para queries de solo lectura
    const games = await Game.find({
      $or: [{ dmId: userId }, { 'players.userId': userId }],
    })
      .populate('dmId', 'name picture')
      .populate('players.userId', 'name picture')
      .lean();

    res.json(games);
  } catch (error) {
    console.error('Error al obtener las partidas del usuario:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener las partidas del usuario' });
  }
});

// Obtener partida y personajes
router.get('/:gameId', authenticateUser, async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId)
      .populate('dmId', 'name picture')
      .populate('players.userId', 'name picture')
      .populate('players.characterId');

    // LOG para depuración: mostrar los players de la partida
    console.log(
      'Players en la partida:',
      JSON.stringify(game.players, null, 2),
    );

    // Construir lista de personajes asociados a la partida con dueño
    let characters = game.players
      .map((p) => {
        const character = p.characterId;
        if (!character) return null;
        // Fallback: si no hay p.userId pero el character tiene playerId, usarlo
        let player = null;
        if (p.userId) {
          player = {
            _id: p.userId._id,
            name: p.userId.name,
            email: p.userId.email,
            picture: p.userId.picture,
          };
        } else if (character.playerId) {
          player = { _id: character.playerId };
        }
        return {
          ...character.toObject(),
          player,
        };
      })
      .filter(Boolean);

    // Poblar itemRef en el inventario de cada personaje
    const { Item } = await import('../models/Item.js');

    // Recopilar todos los itemRefs de todos los personajes
    const allItemRefs = new Set();
    characters.forEach((char) => {
      if (char.inventory && char.inventory.length > 0) {
        char.inventory.forEach((item) => {
          if (item.itemRef) allItemRefs.add(item.itemRef.toString());
        });
      }
    });

    // Una sola query para todos los items
    let itemDataMap = {};
    if (allItemRefs.size > 0) {
      const items = await Item.find({
        _id: { $in: Array.from(allItemRefs) },
      }).lean();
      itemDataMap = items.reduce((acc, item) => {
        acc[item._id.toString()] = item;
        return acc;
      }, {});
    }

    // Mapear los items a cada personaje
    characters = characters.map((char) => {
      if (!char.inventory || char.inventory.length === 0) return char;

      // Mezclar datos del item base en cada item del inventario
      char.inventory = char.inventory.map((item) => {
        if (item.itemRef && itemDataMap[item.itemRef.toString()]) {
          const base = itemDataMap[item.itemRef.toString()];
          // Mezclar manualmente useEffect si existe en el item base
          const mergedItem = {
            ...base,
            ...item,
            useEffect: base.useEffect || item.useEffect || null,
          };
          console.log('📦 Item poblado:', {
            name: mergedItem.name,
            hasUseEffect: !!mergedItem.useEffect,
            useEffect: mergedItem.useEffect,
            type: mergedItem.type,
          });
          return mergedItem;
        }
        return item;
      });
      return char;
    });

    res.json({ game, characters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hacer a un usuario DM (ruta de admin)
router.post('/make-dm/:userId', authenticateUser, async (req, res) => {
  try {
    // Solo para desarrollo - en producción esto debería ser más seguro
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.isDM = true;
    await user.save();

    res.json({ message: 'Usuario ahora es DM', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para crear un personaje
router.post('/characters', async (req, res) => {
  try {
    const { name, classType, level } = req.body;
    const newCharacter = await Character.create({ name, classType, level });
    res.status(201).json(newCharacter);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el personaje' });
  }
});

// Ruta para modificar un personaje
router.put('/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedCharacter = await Character.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedCharacter) {
      return res.status(404).json({ error: 'Personaje no encontrado' });
    }
    res.json(updatedCharacter);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el personaje' });
  }
});

// Ruta para borrar un personaje
router.delete('/characters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCharacter = await Character.findByIdAndDelete(id);
    if (!deletedCharacter) {
      return res.status(404).json({ error: 'Personaje no encontrado' });
    }
    res.json({ message: 'Personaje eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el personaje' });
  }
});

// Ruta para asignar un personaje a una partida
router.post(
  '/games/:gameId/assign-character',
  authenticateUser,
  async (req, res) => {
    try {
      const { gameId } = req.params;
      const { characterId } = req.body;
      const userId = req.user._id;

      // Verificar que el personaje pertenece al usuario autenticado
      const character = await Character.findById(characterId);
      if (!character) {
        return res.status(404).json({ error: 'Personaje no encontrado' });
      }
      if (character.playerId.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ error: 'No autorizado para usar este personaje' });
      }

      // Lógica para asignar el personaje a la partida
      const game = await Game.findById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Partida no encontrada' });
      }

      // Verificar si el personaje ya está asignado a la partida
      if (
        game.players.some(
          (p) => p.characterId && p.characterId.toString() === characterId,
        )
      ) {
        return res
          .status(400)
          .json({ error: 'El personaje ya está asignado a esta partida' });
      }

      // Verificar si el usuario ya tiene un personaje en la partida
      const playerIndex = game.players.findIndex(
        (p) => p.userId.toString() === userId.toString(),
      );
      if (playerIndex !== -1) {
        // Si ya está pero no tiene characterId, lo actualizamos
        if (!game.players[playerIndex].characterId) {
          game.players[playerIndex].characterId = characterId;
          await game.save();
          return res
            .status(200)
            .json({ message: 'Personaje asignado a la partida', game });
        } else {
          return res
            .status(400)
            .json({ error: 'Ya tienes un personaje en esta partida' });
        }
      }

      // Si no está, lo agregamos normalmente
      game.players.push({ userId, characterId });
      await game.save();

      res
        .status(200)
        .json({ message: 'Personaje asignado a la partida', game });
    } catch (error) {
      console.error('Error en /games/:gameId/assign-character:', error);
      res.status(500).json({
        error: error.message || 'Error al asignar el personaje a la partida',
      });
    }
  },
);

// Ruta para obtener las partidas de un usuario
router.get('/my-games', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Buscar partidas donde el usuario sea jugador o DM
    const games = await Game.find({
      $or: [{ dmId: userId }, { 'players.userId': userId }],
    })
      .populate('dmId', 'name picture')
      .populate('players.userId', 'name picture');

    res.json(games);
  } catch (error) {
    console.error('Error al obtener las partidas del usuario:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener las partidas del usuario' });
  }
});

// Endpoint para dejar una partida
router.post('/leave/:gameId', authenticateUser, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id;

    // Buscar la partida
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    // Buscar el jugador en la partida
    const playerIndex = game.players.findIndex(
      (p) => p.userId.toString() === userId.toString(),
    );
    if (playerIndex === -1) {
      return res.status(400).json({ error: 'No estás en esta partida' });
    }

    // Obtener el characterId asociado
    const characterId = game.players[playerIndex].characterId;

    // Quitar al jugador de la partida
    game.players.splice(playerIndex, 1);
    await game.save();

    // Opcional: eliminar el personaje asociado a esta partida
    if (characterId) {
      await Character.findByIdAndDelete(characterId);
    }

    res.json({ message: 'Has salido de la partida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

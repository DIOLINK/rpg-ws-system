import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { Game } from '../models/Game.js';

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
    const { characterName } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Partida no encontrada' });

    // Crear personaje para el jugador
    const character = await Character.create({
      name: characterName,
      playerId: req.user._id,
      gameId: game._id,
      canEdit: false, // Por defecto no puede editar
    });

    // Añadir a la partida
    game.players.push({
      userId: req.user._id,
      characterId: character._id,
    });
    await game.save();

    res.json({ game, character });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener partida y personajes
router.get('/:gameId', authenticateUser, async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await Game.findById(gameId)
      .populate('dmId', 'name picture')
      .populate('players.userId', 'name picture');

    const characters = await Character.find({ gameId }).populate(
      'playerId',
      'name picture'
    );

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

export default router;

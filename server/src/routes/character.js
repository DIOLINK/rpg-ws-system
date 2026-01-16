import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { User } from '../models/User.js';

const router = express.Router();

// Asociar personaje a una partida
router.post(
  '/:characterId/assign-to-game/:gameId',
  authenticateUser,
  async (req, res) => {
    try {
      const { characterId, gameId } = req.params;
      const character = await Character.findById(characterId);
      if (!character)
        return res.status(404).json({ error: 'Personaje no encontrado' });
      // Solo el dueño puede asociar su personaje
      if (character.playerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      character.gameId = gameId;
      character.validated = false; // Siempre requiere validación al asociar
      await character.save();
      res.json({ success: true, character });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Enviar personaje a validación (jugador)
router.post('/:id/send', authenticateUser, async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character)
      return res.status(404).json({ error: 'Personaje no encontrado' });
    // Solo el dueño puede enviar a validación
    if (character.playerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    character.validated = false;
    character.validationComment = '';
    await character.save();
    res.json({ success: true, character });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener personajes pendientes de validación (solo DM)
router.get('/pending', authenticateUser, async (req, res) => {
  try {
    // Solo el DM puede ver esto (puedes mejorar la lógica de permisos)
    if (!req.user.isDM)
      return res.status(403).json({ error: 'Solo el DM puede ver esto' });
    const pending = await Character.find({ validated: false });
    // Opcional: poblar nombre de usuario
    const withPlayer = await Promise.all(
      pending.map(async (char) => {
        const player = await User.findById(char.playerId);
        return {
          ...char.toObject(),
          playerName: player?.username || player?.email,
        };
      })
    );
    res.json(withPlayer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validar personaje (aprobado/rechazado por DM)
router.post('/validate/:id', authenticateUser, async (req, res) => {
  try {
    if (!req.user.isDM)
      return res.status(403).json({ error: 'Solo el DM puede validar' });
    const { approved, comment } = req.body;
    const character = await Character.findById(req.params.id);
    if (!character)
      return res.status(404).json({ error: 'Personaje no encontrado' });
    if (approved) {
      character.validated = true;
      character.validationComment = comment || '';
    } else {
      character.validated = false;
      character.validationComment = comment || 'Rechazado por el DM';
    }
    await character.save();
    // Opcional: notificar al usuario (por socket, email, etc.)
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener personajes del usuario autenticado (con paginación futura)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    // Preparado para paginación futura
    // const { page = 1, limit = 10 } = req.query;
    const characters = await Character.find({ playerId: userId });
    res.json(characters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear personaje (máximo 2 por usuario)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Character.countDocuments({ playerId: userId });
    if (count >= 2) {
      return res.status(400).json({ error: 'Solo puedes tener 2 personajes.' });
    }
    const { name, description, classType } = req.body;
    if (!name)
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    const character = new Character({
      name,
      description,
      classType,
      playerId: userId,
      validated: false,
      validationComment: '',
    });
    await character.save();
    res.status(201).json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar personaje (solo si no está validado y es del usuario)
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const character = await Character.findOne({ _id: id, playerId: userId });
    if (!character)
      return res.status(404).json({ error: 'Personaje no encontrado.' });
    if (character.validated)
      return res
        .status(403)
        .json({ error: 'No puedes editar un personaje validado.' });
    const { name, description } = req.body;
    if (name !== undefined) character.name = name;
    if (description !== undefined) character.description = description;
    await character.save();
    res.json(character);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar personaje (siempre permitido si es del usuario)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const character = await Character.findOneAndDelete({
      _id: id,
      playerId: userId,
    });
    if (!character)
      return res.status(404).json({ error: 'Personaje no encontrado.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enviar personaje a validación (solo si es del usuario y no está validado)
router.post('/:id/send', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const character = await Character.findOne({ _id: id, playerId: userId });
    if (!character)
      return res.status(404).json({ error: 'Personaje no encontrado.' });
    if (character.validated)
      return res.status(400).json({ error: 'El personaje ya está validado.' });
    character.validated = false; // Marca como pendiente
    await character.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

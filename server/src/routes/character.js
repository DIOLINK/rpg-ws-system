import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { Character } from '../models/Character.js';
import { User } from '../models/User.js';

const router = express.Router();

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

export default router;

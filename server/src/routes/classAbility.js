import express from 'express';
import ClassAbility from '../models/ClassAbility.js';
const router = express.Router();

// Obtener todas las habilidades de clase o por clase específica
router.get('/', async (req, res) => {
  try {
    const { classType } = req.query;
    const filter = classType ? { classType } : {};
    const abilities = await ClassAbility.find(filter);
    res.json(abilities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Ruta de ejemplo para autenticación
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Lógica de autenticación aquí
  if (username === 'admin' && password === 'password') {
    res.json({ message: 'Inicio de sesión exitoso', token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

// Ruta para autenticación con Google
router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Aquí puedes buscar o crear el usuario en la base de datos
    const user = { googleId: sub, email, name, picture }; // Ejemplo simplificado

    res.json({ message: 'Autenticación exitosa', user });
  } catch (error) {
    console.error('Error verificando token de Google:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Ruta para obtener información del usuario autenticado
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isDM: user.isDM,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

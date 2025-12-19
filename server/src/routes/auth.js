import express from 'express';
import jwt from 'jsonwebtoken';
import admin from '../config/firebaseAdmin.js';
import { User } from '../models/User.js';

const router = express.Router();

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

  console.log('Token recibido del cliente:', token);

  try {
    // Verificar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Token decodificado:', decodedToken);

    const { uid, email, name, picture } = decodedToken;

    // Aquí puedes buscar o crear el usuario en la base de datos
    const user = { firebaseId: uid, email, name, picture }; // Ejemplo simplificado

    res.json({ message: 'Autenticación exitosa', user });
  } catch (error) {
    console.error('Error verificando token de Firebase:', error);
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

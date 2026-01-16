import express from 'express';
import admin from '../../config/firebaseAdmin.js';
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

    const googleId =
      decodedToken.uid || decodedToken.sub || decodedToken.user_id;
    const email = decodedToken.email;
    const name = decodedToken.name;
    const picture = decodedToken.picture;

    // Buscar al usuario en la base de datos local usando googleId
    let user = await User.findOne({ googleId });

    // Si el usuario no existe, crearlo
    if (!user) {
      user = new User({
        googleId,
        email,
        name,
        picture,
        isDM: false, // Por defecto, no es Dungeon Master
      });

      await user.save();
      console.log('Usuario creado en la base de datos local:', user);
    } else {
      console.log('Usuario ya existe en la base de datos local:', user);
    }

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
    // Validar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const googleId =
      decodedToken.uid || decodedToken.sub || decodedToken.user_id;
    const user = await User.findOne({ googleId });

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
    console.error('Error during token validation:', error);
    res
      .status(500)
      .json({ error: 'An unexpected error occurred during token validation.' });
  }
});

export default router;

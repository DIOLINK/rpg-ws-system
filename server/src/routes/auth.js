import express from 'express';
import jwt from 'jsonwebtoken';
import admin from '../../config/firebaseAdmin.js';
import { authenticateUser } from '../middleware/auth.js';
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

    // Generar un JWT propio para el usuario
    const jwtToken = jwt.sign(
      { id: user._id, googleId: user.googleId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      message: 'Autenticación exitosa',
      user: {
        uid: user.googleId,
        displayName: user.name,
        email: user.email,
        emailVerified: true, // Asumimos true porque Google/Firebase lo valida
        photoURL: user.picture,
        isDM: user.isDM,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Error verificando token de Firebase:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Ruta para obtener información del usuario autenticado usando el middleware
router.get('/me', authenticateUser, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    uid: user.googleId,
    displayName: user.name,
    email: user.email,
    emailVerified: true, // Asumimos true porque Google/Firebase lo valida
    photoURL: user.picture,
    isDM: user.isDM,
    // Puedes agregar más campos si lo deseas
  });
});

export default router;

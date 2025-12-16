import express from 'express';
import { OAuth2Client } from 'google-auth-library';

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

export default router;

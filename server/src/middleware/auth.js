import admin from '../../config/firebaseAdmin.js';
import { User } from '../models/User.js';

// Valida el token usando Firebase Admin SDK
export const verifyToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Token inválido');
  }
};

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Validar el token con Firebase Admin SDK
    const payload = await verifyToken(token);

    // Buscar el identificador más robusto posible
    const googleId = payload.uid || payload.sub || payload.user_id;
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        _id: payload._id,
        googleId,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en authenticateUser:', error);
    res.status(401).json({ error: 'Autenticación fallida' });
  }
};

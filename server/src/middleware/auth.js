import admin from '../../config/firebaseAdmin.js';
import { User } from '../models/User.js';

// Caché de usuarios en memoria para reducir queries a la BD
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Limpiar caché periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now > value.expiresAt) {
      userCache.delete(key);
    }
  }
}, 60 * 1000); // Cada minuto

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

    // Intentar obtener del caché
    const cached = userCache.get(googleId);
    if (cached && Date.now() < cached.expiresAt) {
      req.user = cached.user;
      return next();
    }

    let user = await User.findOne({ googleId }).lean();

    if (!user) {
      user = await User.create({
        _id: payload._id,
        googleId,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
      user = user.toObject();
    }

    // Guardar en caché
    userCache.set(googleId, {
      user,
      expiresAt: Date.now() + CACHE_TTL,
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en authenticateUser:', error);
    res.status(401).json({ error: 'Autenticación fallida' });
  }
};

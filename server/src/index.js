import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/character.js';
import classAbilityRoutes from './routes/classAbility.js';
import gameRoutes from './routes/game.js';
import { createItemRoutes } from './routes/item.js';
import npcRoutes from './routes/npc.js';
import { setupGameSockets } from './socket/gameSocket.js';

// Configurar dotenv para cargar el archivo .env desde la ubicación correcta
import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Conectar a DB
connectDB();

// Rutas

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/class-abilities', classAbilityRoutes);
app.use('/api/npc', npcRoutes(io));

// WebSockets
setupGameSockets(io);

// Rutas que necesitan acceso a io
app.use('/api/items', createItemRoutes(io));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Verificar si FRONTEND_URL está definido
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

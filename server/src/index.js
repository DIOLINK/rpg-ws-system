import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import { setupGameSockets } from './socket/gameSocket.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Conectar a DB
connectDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// WebSockets
setupGameSockets(io);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

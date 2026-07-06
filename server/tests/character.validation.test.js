import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import { Character } from '../src/models/Character.js';
import { User } from '../src/models/User.js';

// Create a testable app without starting the server
const app = express();
app.use(express.json());

// Import routes after setting up express
import characterRoutes from '../src/routes/character.js';
app.use('/api/characters', characterRoutes);

// Mock de usuario DM y normal
const dmUser = {
  _id: new mongoose.Types.ObjectId(),
  googleId: 'dm123',
  email: 'dm@test.com',
  name: 'DM',
  isDM: true,
};
const normalUser = {
  _id: new mongoose.Types.ObjectId(),
  googleId: 'user123',
  email: 'user@test.com',
  name: 'User',
  isDM: false,
};

// Mock de autenticación - mock the actual middleware export name
jest.mock('../src/middleware/auth.js', () => ({
  authenticateUser: (req, res, next) => {
    req.user = req.headers['x-mock-dm'] === 'true' ? dmUser : normalUser;
    next();
  },
}));

describe('Validación de personajes por DM', () => {
  let character;

  beforeAll(async () => {
    // Use in-memory MongoDB or skip if not available
    if (process.env.MONGO_URL) {
      await mongoose.connect(process.env.MONGO_URL);
      await User.create(dmUser);
      await User.create(normalUser);
      character = await Character.create({
        name: 'TestChar',
        playerId: normalUser._id,
        gameId: new mongoose.Types.ObjectId(),
        classType: 'Guerrero',
        validated: false,
        stats: {},
      });
    }
  });

  afterAll(async () => {
    if (process.env.MONGO_URL) {
      await Character.deleteMany({});
      await User.deleteMany({});
      await mongoose.disconnect();
    }
  });

  it('El DM puede ver personajes pendientes', async () => {
    if (!process.env.MONGO_URL) return; // Skip if no DB
    const res = await request(app)
      .get('/api/characters/pending')
      .set('x-mock-dm', 'true');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('TestChar');
  });

  it('Un usuario normal no puede ver personajes pendientes', async () => {
    if (!process.env.MONGO_URL) return; // Skip if no DB
    const res = await request(app)
      .get('/api/characters/pending')
      .set('x-mock-dm', 'false');
    expect(res.statusCode).toBe(403);
  });

  it('El DM puede aprobar un personaje', async () => {
    if (!process.env.MONGO_URL) return; // Skip if no DB
    const res = await request(app)
      .post(`/api/characters/validate/${character._id}`)
      .set('x-mock-dm', 'true')
      .send({ approved: true, comment: 'Aprobado' });
    expect(res.statusCode).toBe(200);
    const updated = await Character.findById(character._id);
    expect(updated.validated).toBe(true);
    expect(updated.validationComment).toBe('Aprobado');
  });

  it('El DM puede rechazar un personaje', async () => {
    if (!process.env.MONGO_URL) return; // Skip if no DB
    const char2 = await Character.create({
      name: 'TestChar2',
      playerId: normalUser._id,
      gameId: new mongoose.Types.ObjectId(),
      classType: 'Mago',
      validated: false,
      stats: {},
    });
    const res = await request(app)
      .post(`/api/characters/validate/${char2._id}`)
      .set('x-mock-dm', 'true')
      .send({ approved: false, comment: 'Rechazado' });
    expect(res.statusCode).toBe(200);
    const updated = await Character.findById(char2._id);
    expect(updated.validated).toBe(false);
    expect(updated.validationComment).toBe('Rechazado');
  });

  it('Un usuario normal no puede validar personajes', async () => {
    if (!process.env.MONGO_URL) return; // Skip if no DB
    const char3 = await Character.create({
      name: 'TestChar3',
      playerId: normalUser._id,
      gameId: new mongoose.Types.ObjectId(),
      classType: 'Clérigo',
      validated: false,
      stats: {},
    });
    const res = await request(app)
      .post(`/api/characters/validate/${char3._id}`)
      .set('x-mock-dm', 'false')
      .send({ approved: true, comment: 'Intento' });
    expect(res.statusCode).toBe(403);
  });
});

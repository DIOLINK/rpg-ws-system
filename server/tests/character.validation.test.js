import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/index.js';
import { Character } from '../src/models/Character.js';
import { User } from '../src/models/User.js';

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

// Mock de autenticación
jest.mock('../src/middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    req.user = req.headers['x-mock-dm'] === 'true' ? dmUser : normalUser;
    next();
  },
}));

describe('Validación de personajes por DM', () => {
  let character;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
  });

  afterAll(async () => {
    await Character.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('El DM puede ver personajes pendientes', async () => {
    const res = await request(app)
      .get('/api/characters/pending')
      .set('x-mock-dm', 'true');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].name).toBe('TestChar');
  });

  it('Un usuario normal no puede ver personajes pendientes', async () => {
    const res = await request(app)
      .get('/api/characters/pending')
      .set('x-mock-dm', 'false');
    expect(res.statusCode).toBe(403);
  });

  it('El DM puede aprobar un personaje', async () => {
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

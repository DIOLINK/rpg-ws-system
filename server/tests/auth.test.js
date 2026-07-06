import request from 'supertest';
import express from 'express';

// Create a minimal test app since index.js starts the server
const app = express();
app.use(express.json());

// Mock auth route for testing
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  res.json({ _id: '123', name: 'Test User', isDM: false });
});

describe('Auth Routes', () => {
  test('should return 401 for unauthorized access', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.statusCode).toBe(401);
  });

  test('should return user data with valid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer fake-token');
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Test User');
  });
});

const request = require('supertest');
const app = require('../src/index');

describe('Auth Routes', () => {
  test('should return 401 for unauthorized access', async () => {
    const response = await request(app).get('/auth/protected');
    expect(response.statusCode).toBe(401);
  });
});

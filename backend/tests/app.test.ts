import request from 'supertest';
import { createApp } from '../src/app';

describe('App', () => {
  const app = createApp();

  test('should respond with 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });

  test('should have CORS enabled', async () => {
    const response = await request(app)
      .options('/api/verify-signature')
      .expect(200);

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('should handle JSON requests', async () => {
    const response = await request(app)
      .post('/api/verify-signature')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.isValid).toBe(false);
  });
});

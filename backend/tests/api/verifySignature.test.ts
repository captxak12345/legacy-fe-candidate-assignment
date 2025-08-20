import request from 'supertest';
import { createApp } from '../../src/app';

describe('Verify Signature API', () => {
  const app = createApp();

  test('should return 400 for missing message', async () => {
    const response = await request(app)
      .post('/api/verify-signature')
      .send({ signature: 'test-signature' })
      .expect(400);

    expect(response.body.isValid).toBe(false);
    expect(response.body.error).toContain('Message');
  });

  test('should return 400 for missing signature', async () => {
    const response = await request(app)
      .post('/api/verify-signature')
      .send({ message: 'test-message' })
      .expect(400);

    expect(response.body.isValid).toBe(false);
    expect(response.body.error).toContain('Signature');
  });

  test('should return 400 for invalid signature format', async () => {
    const response = await request(app)
      .post('/api/verify-signature')
      .send({ 
        message: 'test-message',
        signature: 'invalid-signature' 
      })
      .expect(400);

    expect(response.body.isValid).toBe(false);
  });

  test('should provide API info on GET request', async () => {
    const response = await request(app)
      .get('/api/verify-signature')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('endpoints');
    expect(response.body.message).toContain('Signature Verification API');
  });
});

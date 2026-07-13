import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /health', () => {
  it('responde con status 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('retorna el campo status con valor "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('retorna el campo timestamp como string ISO', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});

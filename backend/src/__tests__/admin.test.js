import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock DB
vi.mock('../config/db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

// Use vi.hoisted to declare mock functions before they are referenced by vi.mock
const { mockInvalidateCachePattern } = vi.hoisted(() => ({
  mockInvalidateCachePattern: vi.fn()
}));

vi.mock('../config/redis.js', () => ({
  invalidateCachePattern: mockInvalidateCachePattern,
  default: {}
}));

import app from '../app.js';
import env from '../config/env.js';

describe('POST /api/admin/cache/invalidate', () => {
  beforeEach(() => {
    mockInvalidateCachePattern.mockClear();
  });

  it('debe responder 401 si no se envía el token', async () => {
    const res = await request(app).post('/api/admin/cache/invalidate');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'No autorizado');
    expect(mockInvalidateCachePattern).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el token es incorrecto', async () => {
    const res = await request(app)
      .post('/api/admin/cache/invalidate')
      .set('x-admin-token', 'token-incorrecto');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'No autorizado');
    expect(mockInvalidateCachePattern).not.toHaveBeenCalled();
  });

  it('debe responder 200 e invalidar la caché si el token es correcto', async () => {
    const res = await request(app)
      .post('/api/admin/cache/invalidate')
      .set('x-admin-token', env.ADMIN_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Caché invalidada correctamente');
    expect(mockInvalidateCachePattern).toHaveBeenCalledWith('reportes:*');
  });
});

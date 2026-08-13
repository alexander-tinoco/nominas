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
import { authCookie } from './helpers/authCookie.js';

describe('Rutas /api/admin — autenticación y rol', () => {
  it('debe responder 401 si no se envía cookie de sesión', async () => {
    const res = await request(app).post('/api/admin/cache/invalidate');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'No autenticado');
  });

  it('debe responder 403 si la sesión es de un usuario sin rol admin', async () => {
    const res = await request(app)
      .post('/api/admin/cache/invalidate')
      .set('Cookie', authCookie('usuario'));
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/admin/cache/invalidate', () => {
  beforeEach(() => {
    mockInvalidateCachePattern.mockClear();
  });

  it('debe responder 401 si no se envía el token x-admin-token', async () => {
    const res = await request(app)
      .post('/api/admin/cache/invalidate')
      .set('Cookie', authCookie('admin'));
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'No autorizado');
    expect(mockInvalidateCachePattern).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el token x-admin-token es incorrecto', async () => {
    const res = await request(app)
      .post('/api/admin/cache/invalidate')
      .set('Cookie', authCookie('admin'))
      .set('x-admin-token', 'token-incorrecto');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'No autorizado');
    expect(mockInvalidateCachePattern).not.toHaveBeenCalled();
  });

  it('debe responder 200 e invalidar la caché si la sesión es admin y el token es correcto', async () => {
    const res = await request(app)
      .post('/api/admin/cache/invalidate')
      .set('Cookie', authCookie('admin'))
      .set('x-admin-token', env.ADMIN_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Caché invalidada correctamente');
    expect(mockInvalidateCachePattern).toHaveBeenCalledWith('reportes:*');
  });
});

describe('GET /api/admin/logs-seguridad', () => {
  it('debe responder 403 si la sesión no tiene rol admin', async () => {
    const res = await request(app)
      .get('/api/admin/logs-seguridad')
      .set('Cookie', authCookie('usuario'));
    expect(res.status).toBe(403);
  });

  it('debe responder 200 con la lista de eventos si la sesión es admin', async () => {
    const { default: pool } = await import('../config/db.js');
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, fecha_hora: new Date(), usuario: 'admin@nominas.local', evento: 'login_exitoso', nivel: 'INFO', detalle: {} }],
    });

    const res = await request(app)
      .get('/api/admin/logs-seguridad')
      .set('Cookie', authCookie('admin'));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

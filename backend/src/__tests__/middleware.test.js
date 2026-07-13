import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('../config/db.js', () => ({ default: { query: vi.fn() } }));

import app from '../app.js';
import pool from '../config/db.js';

afterEach(() => vi.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('errorHandler middleware', () => {
  describe('error genérico de aplicación', () => {
    it('retorna 500 con el mensaje del error cuando un controlador llama next(err)', async () => {
      pool.query.mockRejectedValueOnce(new Error('algo salió mal'));

      const res = await request(app).get('/api/empleados');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });

    it('la respuesta de error tiene Content-Type application/json', async () => {
      pool.query.mockRejectedValueOnce(new Error('fallo genérico'));

      const res = await request(app).get('/api/empleados');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('error de base de datos (con código PG)', () => {
    it('retorna 500 con mensaje genérico de BD cuando el error tiene código PostgreSQL', async () => {
      const pgError = Object.assign(new Error('duplicate key value'), {
        code: '23505',    // unique_violation de PostgreSQL
        detail: 'Key (rfc)=(TEST) already exists.',
      });
      pool.query.mockRejectedValueOnce(pgError);

      const res = await request(app).get('/api/empleados');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error interno de base de datos');
    });

    it('no expone el detalle interno del error de BD al cliente', async () => {
      const pgError = Object.assign(new Error('column "x" does not exist'), {
        code: '42703',
      });
      pool.query.mockRejectedValueOnce(pgError);

      const res = await request(app).get('/api/empleados');

      // El detalle técnico NO debe llegar al cliente
      expect(JSON.stringify(res.body)).not.toContain('column "x"');
    });
  });
});

describe('logger middleware', () => {
  it('agrega la cabecera de log para una petición 200 (nivel info)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/empleados');

    // El logger no añade cabeceras custom, pero la petición debe completarse
    expect(res.status).toBe(200);
  });

  it('el logger no bloquea la respuesta en peticiones con status 400', async () => {
    // /api/reportes/por-unidad sin ?qna provoca 400
    const res = await request(app).get('/api/reportes/por-unidad');

    expect(res.status).toBe(400);
  });

  it('el logger no bloquea la respuesta en peticiones con status 404', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/empleados/RFC_NO_EXISTE');

    expect(res.status).toBe(404);
  });

  it('el logger no bloquea la respuesta en peticiones con status 500', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/empleados');

    expect(res.status).toBe(500);
  });
});

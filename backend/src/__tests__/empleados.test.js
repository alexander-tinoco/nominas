import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('../config/db.js', () => ({ default: { query: vi.fn() } }));

import app from '../app.js';
import pool from '../config/db.js';

afterEach(() => vi.clearAllMocks());

// ─── Helpers ────────────────────────────────────────────────────────────────
const mockEmpleados = (total, rows) => {
  pool.query
    .mockResolvedValueOnce({ rows: [{ total: String(total) }] })
    .mockResolvedValueOnce({ rows });
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('GET /api/empleados', () => {
  describe('paginación', () => {
    it('usa page=1 y limit=20 por defecto', async () => {
      mockEmpleados(42, [
        { rfc: 'LOAA880101ABC', nom_emp: 'Ana López' },
        { rfc: 'MGRB900202DEF', nom_emp: 'Bernardo Mora' },
      ]);

      const res = await request(app).get('/api/empleados');

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({ total: 42, page: 1, limit: 20, totalPages: 3 });
      expect(res.body.data).toHaveLength(2);
    });

    it('respeta page y limit custom', async () => {
      mockEmpleados(15, []);

      const res = await request(app).get('/api/empleados?page=2&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({ page: 2, limit: 5, totalPages: 3 });
    });

    it('clampea limit máximo a 100', async () => {
      mockEmpleados(50, []);

      const res = await request(app).get('/api/empleados?limit=9999');

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(100);
    });

    it('clampea page mínima a 1 cuando se pasa un valor inválido', async () => {
      mockEmpleados(10, []);

      const res = await request(app).get('/api/empleados?page=-5');

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    it('calcula totalPages=0 cuando no hay resultados', async () => {
      mockEmpleados(0, []);

      const res = await request(app).get('/api/empleados');

      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({ total: 0, totalPages: 0 });
    });
  });

  describe('búsqueda', () => {
    it('filtra empleados por nombre con ?search=', async () => {
      mockEmpleados(1, [{ rfc: 'LOAA880101ABC', nom_emp: 'Ana López' }]);

      const res = await request(app).get('/api/empleados?search=ana');

      expect(res.status).toBe(200);
      expect(res.body.data[0].nom_emp).toBe('Ana López');
    });

    it('pasa el patrón ILIKE al pool con los wildcards correctos', async () => {
      mockEmpleados(1, [{ rfc: 'LOAA880101ABC', nom_emp: 'Ana López' }]);

      await request(app).get('/api/empleados?search=ana');

      const callParams = pool.query.mock.calls[0][1];
      expect(callParams).toContain('%ana%');
    });

    it('recorta espacios del término de búsqueda', async () => {
      mockEmpleados(1, []);

      await request(app).get('/api/empleados?search=  garcia  ');

      const callParams = pool.query.mock.calls[0][1];
      expect(callParams).toContain('%garcia%');
    });

    it('sin ?search pasa null al pool (sin filtro)', async () => {
      mockEmpleados(5, []);

      await request(app).get('/api/empleados');

      const callParams = pool.query.mock.calls[0][1];
      expect(callParams).toContain(null);
    });
  });

  describe('errores', () => {
    it('retorna 500 cuando el pool lanza un error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB connection refused'));

      const res = await request(app).get('/api/empleados');

      expect(res.status).toBe(500);
    });
  });
});

describe('GET /api/empleados/:rfc', () => {
  it('retorna 404 si el RFC no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/empleados/XXXX000000XXX');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna el historial del empleado si el RFC existe', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ rfc: 'LOAA880101ABC', nom_emp: 'Ana López', qna_pago: 202401 }],
    });

    const res = await request(app).get('/api/empleados/LOAA880101ABC');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rfc', 'LOAA880101ABC');
    expect(res.body).toHaveProperty('nombre', 'Ana López');
    expect(Array.isArray(res.body.historial)).toBe(true);
  });

  it('retorna el nombre del primer registro del historial', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { rfc: 'LOAA880101ABC', nom_emp: 'Ana López', qna_pago: 202401 },
        { rfc: 'LOAA880101ABC', nom_emp: 'Ana López', qna_pago: 202402 },
      ],
    });

    const res = await request(app).get('/api/empleados/LOAA880101ABC');

    expect(res.body.historial).toHaveLength(2);
  });

  it('retorna 500 cuando el pool lanza un error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/empleados/LOAA880101ABC');

    expect(res.status).toBe(500);
  });
});

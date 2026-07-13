import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('../config/db.js', () => ({ default: { query: vi.fn() } }));

import app from '../app.js';
import pool from '../config/db.js';

afterEach(() => vi.clearAllMocks());

// ─── Helpers ────────────────────────────────────────────────────────────────
// El controlador ejecuta Promise.all([summaryQuery, dataQuery]) → 2 llamadas.
const mockNomina = ({ total = 5, percepciones = 10000, deducciones = 2000, neto = 8000, rows = [] } = {}) => {
  pool.query
    // 1ª llamada: summaryQuery
    .mockResolvedValueOnce({
      rows: [{ total, total_percepciones: percepciones, total_deducciones: deducciones, total_neto: neto }],
    })
    // 2ª llamada: dataQuery
    .mockResolvedValueOnce({ rows });
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('GET /api/nomina', () => {
  describe('estructura de respuesta', () => {
    it('retorna los campos data, summary y pagination', async () => {
      mockNomina({ total: 5, rows: [{ rfc: 'TEST001', nom_emp: 'Test', edad: 30 }] });

      const res = await request(app).get('/api/nomina');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('pagination');
    });

    it('la paginación refleja los valores correctos de total y páginas', async () => {
      mockNomina({ total: 50 });

      const res = await request(app).get('/api/nomina?limit=10');

      expect(res.body.pagination).toMatchObject({ total: 50, limit: 10, totalPages: 5 });
    });
  });

  describe('summary (acumulados contables)', () => {
    it('retorna total, totalPercepciones, totalDeducciones y totalNeto', async () => {
      mockNomina({ total: 10, percepciones: 100000.5, deducciones: 15000, neto: 85000.5 });

      const res = await request(app).get('/api/nomina');

      expect(res.body.summary).toMatchObject({
        total: 10,
        totalPercepciones: 100000.5,
        totalDeducciones: 15000,
        totalNeto: 85000.5,
      });
    });
  });

  describe('filtros básicos', () => {
    it('acepta filtro por unidad (número entero)', async () => {
      mockNomina({ total: 3 });

      const res = await request(app).get('/api/nomina?unidad=1');

      expect(res.status).toBe(200);
      // El valor entero 1 debe haber sido pasado como parámetro a la query
      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain(1);
    });

    it('acepta filtro por qna_pago (quincena)', async () => {
      mockNomina({ total: 8 });

      const res = await request(app).get('/api/nomina?qna_pago=202401');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain(202401);
    });

    it('acepta búsqueda general por RFC o nombre con ?search=', async () => {
      mockNomina({ total: 2 });

      const res = await request(app).get('/api/nomina?search=garcia');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs.some((a) => typeof a === 'string' && a.includes('garcia'))).toBe(true);
    });
  });

  describe('filtro de edad', () => {
    it('acepta edad_min y pasa el valor numérico correcto a la query', async () => {
      mockNomina({ total: 5 });

      await request(app).get('/api/nomina?edad_min=30');

      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain(30);
    });

    it('acepta edad_max y pasa el valor numérico correcto a la query', async () => {
      mockNomina({ total: 5 });

      await request(app).get('/api/nomina?edad_max=55');

      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain(55);
    });

    it('acepta rango edad_min + edad_max simultáneamente', async () => {
      mockNomina({ total: 3 });

      const res = await request(app).get('/api/nomina?edad_min=30&edad_max=45');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain(30);
      expect(allArgs).toContain(45);
    });
  });

  describe('filtro de concepto', () => {
    it('acepta el parámetro concepto y lo pasa a la query de existencia', async () => {
      mockNomina({ total: 1 });

      const res = await request(app).get('/api/nomina?concepto=P001');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain('P001');
    });

    it('acepta filtro por tipo de concepto (P=percepción, D=deducción)', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?concepto_tipo=P');

      const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
      expect(allArgs).toContain('P');
    });
  });
});

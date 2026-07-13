import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

vi.mock('../config/db.js', () => ({ default: { query: vi.fn() } }));

import app from '../app.js';
import pool from '../config/db.js';

afterEach(() => vi.clearAllMocks());

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('GET /api/reportes/por-unidad', () => {
  describe('validación de parámetros', () => {
    it('retorna 400 si no se pasa el parámetro ?qna=', async () => {
      const res = await request(app).get('/api/reportes/por-unidad');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('retorna 400 si ?qna= no es un número válido', async () => {
      const res = await request(app).get('/api/reportes/por-unidad?qna=abc');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('datos agrupados por unidad', () => {
    it('retorna 200 con los datos agrupados por unidad', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { etiqueta: 'Unidad 1', unidad: '1', total_percepciones: 500000, total_deducciones: 80000, total_neto: 420000 },
          { etiqueta: 'Unidad 2', unidad: '2', total_percepciones: 200000, total_deducciones: 40000, total_neto: 160000 },
        ],
      });

      const res = await request(app).get('/api/reportes/por-unidad?qna=202401');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('qna', 202401);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('cada elemento del array contiene los campos esperados', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { etiqueta: 'Unidad 1', unidad: '1', total_percepciones: 500000, total_deducciones: 80000, total_neto: 420000 },
        ],
      });

      const res = await request(app).get('/api/reportes/por-unidad?qna=202401');

      const item = res.body.data[0];
      expect(item).toHaveProperty('unidad');
      expect(item).toHaveProperty('total_percepciones');
      expect(item).toHaveProperty('total_deducciones');
      expect(item).toHaveProperty('total_neto');
    });

    it('pasa el qna como entero al pool.query', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await request(app).get('/api/reportes/por-unidad?qna=202401');

      const callParams = pool.query.mock.calls[0][1];
      expect(callParams).toContain(202401);
    });
  });

  describe('agrupación por subunidad', () => {
    it('agrupa por subunidad cuando ?subunidad=true', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { etiqueta: 'U-1 S-10', unidad: '1', subunidad: '10', total_percepciones: 100000, total_deducciones: 10000, total_neto: 90000 },
        ],
      });

      const res = await request(app).get('/api/reportes/por-unidad?qna=202401&subunidad=true');

      expect(res.status).toBe(200);
      expect(res.body.groupedBySubunidad).toBe(true);
    });
  });
});

describe('GET /api/reportes/conceptos', () => {
  it('retorna 200 con los datos de conceptos', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { etiqueta: 'C-001 (P)', concepto: '001', perc_ded: 'P', total_importe: 500000 },
        { etiqueta: 'C-002 (D)', concepto: '002', perc_ded: 'D', total_importe: 80000 },
      ],
    });

    const res = await request(app).get('/api/reportes/conceptos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('retorna 400 si qna_start no es un entero válido', async () => {
    const res = await request(app).get('/api/reportes/conceptos?qna_start=abc');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('acepta rango de quincenas con qna_start y qna_end', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/reportes/conceptos?qna_start=202401&qna_end=202412');

    expect(res.status).toBe(200);
    expect(res.body.filters).toMatchObject({ qna_start: 202401, qna_end: 202412 });
  });
});

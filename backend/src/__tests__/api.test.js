import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

// ─── Mock de la base de datos (debe ir antes de importar app) ──────────────
vi.mock('../config/db.js', () => {
  const pool = { query: vi.fn() };
  return { default: pool };
});

import app from '../app.js';
import pool from '../config/db.js';

// Garantiza que el mock se limpia después de CADA test, sin importar el describe
afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('responde 200 con { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/empleados — paginación
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/empleados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna paginación con valores por defecto (page=1, limit=20)', async () => {
    // Primera llamada → conteo, segunda → datos
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '42' }] })
      .mockResolvedValueOnce({
        rows: [
          { rfc: 'LOAA880101ABC', nom_emp: 'Ana López' },
          { rfc: 'MGRB900202DEF', nom_emp: 'Bernardo Mora' },
        ],
      });

    const res = await request(app).get('/api/empleados');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toMatchObject({
      total: 42,
      page: 1,
      limit: 20,
      totalPages: 3,
    });
    expect(res.body.data).toHaveLength(2);
  });

  it('respeta parámetros de paginación custom (page=2, limit=5)', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '15' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/empleados?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 5, totalPages: 3 });
  });

  it('busca empleados por nombre usando el parámetro search', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ rfc: 'LOAA880101ABC', nom_emp: 'Ana López' }] });

    const res = await request(app).get('/api/empleados?search=ana');

    expect(res.status).toBe(200);
    expect(res.body.data[0].nom_emp).toBe('Ana López');
    // Verifica que el patrón ILIKE se pasó correctamente
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['%ana%'])
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers compartidos para tests de nómina
// El controlador usa Promise.all([summaryQuery, dataQuery]) → 2 llamadas al pool
// ─────────────────────────────────────────────────────────────────────────────
const makeSummary = ({ total = 5, percepciones = 10000, deducciones = 2000, neto = 8000 } = {}) => ({
  rows: [{ total, total_percepciones: percepciones, total_deducciones: deducciones, total_neto: neto }],
});
const makeData = (rows = [{ rfc: 'TEST001', nom_emp: 'Test', edad: 35 }]) => ({ rows });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/nomina — filtros básicos
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/nomina', () => {
  it('retorna 200 con filtro por unidad', async () => {
    pool.query
      .mockResolvedValueOnce(makeSummary({ total: 5 }))   // 1ª: summaryQuery
      .mockResolvedValueOnce(makeData());                  // 2ª: dataQuery

    const res = await request(app).get('/api/nomina?unidad=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('summary');
  });

  it('retorna 200 con filtro por qna_pago', async () => {
    pool.query
      .mockResolvedValueOnce(makeSummary({ total: 3 }))
      .mockResolvedValueOnce(makeData());

    const res = await request(app).get('/api/nomina?qna_pago=202401');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/nomina — filtro de edad
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/nomina — filtro de edad', () => {
  it('acepta edad_min y edad_max como parámetros de consulta', async () => {
    pool.query
      .mockResolvedValueOnce(makeSummary({ total: 2 }))
      .mockResolvedValueOnce(makeData());

    const res = await request(app).get('/api/nomina?edad_min=30&edad_max=45');
    expect(res.status).toBe(200);
    // Verifica que los parámetros numéricos de edad fueron pasados a la query
    const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
    expect(allArgs.some((arg) => arg === 30 || arg === 45)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/nomina — filtro de concepto
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/nomina — filtro de concepto', () => {
  it('acepta el parámetro concepto para filtrar registros', async () => {
    pool.query
      .mockResolvedValueOnce(makeSummary({ total: 1 }))
      .mockResolvedValueOnce(makeData());

    const res = await request(app).get('/api/nomina?concepto=P001');
    expect(res.status).toBe(200);
    const allArgs = pool.query.mock.calls.flatMap(([, params]) => params ?? []);
    expect(allArgs.some((arg) => arg === 'P001')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/nomina — summary (acumulados contables)
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/nomina — summary', () => {
  it('retorna los acumulados summary con los valores correctos', async () => {
    // Promise.all → summaryQuery primero, dataQuery segundo
    pool.query
      .mockResolvedValueOnce(makeSummary({ total: 10, percepciones: 100000.5, deducciones: 15000.0, neto: 85000.5 }))
      .mockResolvedValueOnce(makeData(Array(10).fill({ rfc: 'TEST', nom_emp: 'Test', edad: 35 })));

    const res = await request(app).get('/api/nomina');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary).toMatchObject({
      total: 10,
      totalPercepciones: 100000.5,
      totalDeducciones: 15000.0,
      totalNeto: 85000.5,
    });
    expect(res.body.pagination.total).toBe(10);
    expect(res.body.pagination.totalPages).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reportes/por-unidad
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/reportes/por-unidad', () => {
  it('retorna 400 si no se pasa el parámetro qna requerido', async () => {
    const res = await request(app).get('/api/reportes/por-unidad');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('retorna 200 con datos agrupados por unidad cuando se pasa ?qna=', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { etiqueta: 'Unidad 1', unidad: '1', total_percepciones: 500000, total_deducciones: 80000, total_neto: 420000 },
        { etiqueta: 'Unidad 2', unidad: '2', total_percepciones: 200000, total_deducciones: 40000, total_neto: 160000 },
      ],
    });

    const res = await request(app).get('/api/reportes/por-unidad?qna=202401');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('unidad');
    expect(res.body.qna).toBe(202401);
  });
});


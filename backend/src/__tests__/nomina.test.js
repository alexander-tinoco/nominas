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
    .mockResolvedValueOnce({
      rows: [{ total, total_percepciones: percepciones, total_deducciones: deducciones, total_neto: neto }],
    })
    .mockResolvedValueOnce({ rows });
};

// getNominaById usa Promise.all([registroQuery, conceptosQuery]) → 2 llamadas.
const mockNominaById = (registro, conceptos = []) => {
  pool.query
    .mockResolvedValueOnce({ rows: registro })
    .mockResolvedValueOnce({ rows: conceptos });
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

    it('clampea page mínima a 1', async () => {
      mockNomina();

      const res = await request(app).get('/api/nomina?page=0');

      expect(res.body.pagination.page).toBe(1);
    });

    it('clampea limit máximo a 100', async () => {
      mockNomina({ total: 10 });

      const res = await request(app).get('/api/nomina?limit=9999');

      expect(res.body.pagination.limit).toBe(100);
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

    it('summary con total 0 genera totalPages 0', async () => {
      mockNomina({ total: 0 });

      const res = await request(app).get('/api/nomina');

      expect(res.body.pagination.totalPages).toBe(0);
    });
  });

  describe('filtros básicos', () => {
    it('acepta filtro por unidad (número entero)', async () => {
      mockNomina({ total: 3 });

      const res = await request(app).get('/api/nomina?unidad=1');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(1);
    });

    it('acepta filtro por subunidad', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?subunidad=3');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(3);
    });

    it('acepta filtro por qna_pago (quincena)', async () => {
      mockNomina({ total: 8 });

      const res = await request(app).get('/api/nomina?qna_pago=202401');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(202401);
    });

    it('acepta rango de quincenas con qna_pago_min y qna_pago_max', async () => {
      mockNomina({ total: 4 });

      await request(app).get('/api/nomina?qna_pago_min=202401&qna_pago_max=202406');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(202401);
      expect(allArgs).toContain(202406);
    });

    it('acepta filtro por qna_ini y qna_fin', async () => {
      mockNomina();

      await request(app).get('/api/nomina?qna_ini=202401&qna_fin=202401');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(202401);
    });

    it('acepta búsqueda general por RFC o nombre con ?search=', async () => {
      mockNomina({ total: 2 });

      const res = await request(app).get('/api/nomina?search=garcia');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs.some((a) => typeof a === 'string' && a.includes('garcia'))).toBe(true);
    });

    it('acepta filtro por RFC exacto', async () => {
      mockNomina({ total: 1 });

      await request(app).get('/api/nomina?rfc=LOAA880101ABC');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('LOAA880101ABC');
    });

    it('acepta filtro por nom_emp (ILIKE)', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?nom_emp=Lopez');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs.some((a) => typeof a === 'string' && a.includes('Lopez'))).toBe(true);
    });

    it('acepta filtro por cat_puesto', async () => {
      mockNomina({ total: 5 });

      await request(app).get('/api/nomina?cat_puesto=A01');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('A01');
    });

    it('acepta filtro por ent_fed', async () => {
      mockNomina({ total: 3 });

      await request(app).get('/api/nomina?ent_fed=15');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(15);
    });

    it('acepta filtro por mot_mov', async () => {
      mockNomina({ total: 1 });

      await request(app).get('/api/nomina?mot_mov=6');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(6);
    });
  });

  describe('filtros de Centro de Trabajo', () => {
    it('acepta filtro por ct_clasif', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?ct_clasif=F');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('F');
    });

    it('acepta filtro por ct_id', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?ct_id=CT001');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('CT001');
    });

    it('acepta filtro por ct_secuencial', async () => {
      mockNomina({ total: 1 });

      await request(app).get('/api/nomina?ct_secuencial=42');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(42);
    });

    it('acepta filtro por ct_digito_ver', async () => {
      mockNomina({ total: 1 });

      await request(app).get('/api/nomina?ct_digito_ver=7');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('7');
    });

    it('acepta búsqueda de CT con ct_search (ILIKE en clasif/id/secuencial)', async () => {
      mockNomina({ total: 3 });

      const res = await request(app).get('/api/nomina?ct_search=abc');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs.some((a) => typeof a === 'string' && a.includes('abc'))).toBe(true);
    });
  });

  describe('filtros de importes', () => {
    it('acepta neto_min y neto_max', async () => {
      mockNomina({ total: 4 });

      await request(app).get('/api/nomina?neto_min=5000&neto_max=20000');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(5000);
      expect(allArgs).toContain(20000);
    });

    it('acepta perc_min y perc_max', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?perc_min=1000&perc_max=8000');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(1000);
      expect(allArgs).toContain(8000);
    });

    it('acepta ded_min y ded_max', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?ded_min=100&ded_max=3000');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(100);
      expect(allArgs).toContain(3000);
    });
  });

  describe('filtros de condiciones de plaza', () => {
    it('acepta horas_min y horas_max', async () => {
      mockNomina({ total: 3 });

      await request(app).get('/api/nomina?horas_min=20&horas_max=40');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(20);
      expect(allArgs).toContain(40);
    });

    it('acepta nivel_sueldo_min y nivel_sueldo_max', async () => {
      mockNomina({ total: 5 });

      await request(app).get('/api/nomina?nivel_sueldo_min=10&nivel_sueldo_max=50');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(10);
      expect(allArgs).toContain(50);
    });
  });

  describe('filtro de edad', () => {
    it('acepta edad_min y pasa el valor numérico correcto a la query', async () => {
      mockNomina({ total: 5 });

      await request(app).get('/api/nomina?edad_min=30');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(30);
    });

    it('acepta edad_max y pasa el valor numérico correcto a la query', async () => {
      mockNomina({ total: 5 });

      await request(app).get('/api/nomina?edad_max=55');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(55);
    });

    it('acepta rango edad_min + edad_max simultáneamente', async () => {
      mockNomina({ total: 3 });

      const res = await request(app).get('/api/nomina?edad_min=30&edad_max=45');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(30);
      expect(allArgs).toContain(45);
    });
  });

  describe('filtro de concepto', () => {
    it('acepta el parámetro concepto y lo pasa a la query de existencia', async () => {
      mockNomina({ total: 1 });

      const res = await request(app).get('/api/nomina?concepto=P001');

      expect(res.status).toBe(200);
      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('P001');
    });

    it('acepta filtro por tipo de concepto (P=percepción, D=deducción)', async () => {
      mockNomina({ total: 2 });

      await request(app).get('/api/nomina?concepto_tipo=P');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain('P');
    });

    it('acepta filtro por concepto_importe_min', async () => {
      mockNomina({ total: 3 });

      await request(app).get('/api/nomina?concepto_importe_min=500');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(500);
    });

    it('acepta filtro por concepto_importe_max', async () => {
      mockNomina({ total: 3 });

      await request(app).get('/api/nomina?concepto_importe_max=9000');

      const allArgs = pool.query.mock.calls.flatMap(([, p]) => p ?? []);
      expect(allArgs).toContain(9000);
    });

    it('acepta todos los filtros de concepto combinados', async () => {
      mockNomina({ total: 1 });

      const res = await request(app).get(
        '/api/nomina?concepto=P001&concepto_tipo=P&concepto_importe_min=100&concepto_importe_max=5000'
      );

      expect(res.status).toBe(200);
    });
  });

  describe('errores', () => {
    it('retorna 500 cuando el pool lanza un error en las queries paralelas', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB connection refused'));

      const res = await request(app).get('/api/nomina');

      expect(res.status).toBe(500);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/nomina/:num_cons
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/nomina/:num_cons', () => {
  describe('validación de parámetro', () => {
    it('retorna 400 si num_cons no es un entero válido', async () => {
      const res = await request(app).get('/api/nomina/abc');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('registro no encontrado', () => {
    it('retorna 404 si num_cons no existe', async () => {
      mockNominaById([]);

      const res = await request(app).get('/api/nomina/99999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('99999');
    });
  });

  describe('registro encontrado', () => {
    it('retorna 200 con los datos del registro', async () => {
      mockNominaById(
        [{ num_cons: 1, rfc: 'LOAA880101ABC', nom_emp: 'Ana López', tot_net_cheque: 8000 }],
        []
      );

      const res = await request(app).get('/api/nomina/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rfc', 'LOAA880101ABC');
      expect(res.body).toHaveProperty('nom_emp', 'Ana López');
    });

    it('separa los conceptos en percepciones y deducciones', async () => {
      mockNominaById(
        [{ num_cons: 1, rfc: 'LOAA880101ABC', nom_emp: 'Ana López' }],
        [
          { perc_ded: 'P', concepto: 'P01', importe: '5000.00', qna_ini: 202401, qna_fin: 202401 },
          { perc_ded: 'P', concepto: 'P02', importe: '3000.00', qna_ini: 202401, qna_fin: 202401 },
          { perc_ded: 'D', concepto: 'D01', importe: '1200.00', qna_ini: 202401, qna_fin: 202401 },
        ]
      );

      const res = await request(app).get('/api/nomina/1');

      expect(res.status).toBe(200);
      expect(res.body.percepciones).toHaveLength(2);
      expect(res.body.deducciones).toHaveLength(1);
    });

    it('convierte los importes de concepto a número flotante', async () => {
      mockNominaById(
        [{ num_cons: 1, rfc: 'TEST', nom_emp: 'Test' }],
        [{ perc_ded: 'P', concepto: 'P01', importe: '1234.56', qna_ini: 202401, qna_fin: 202401 }]
      );

      const res = await request(app).get('/api/nomina/1');

      expect(typeof res.body.percepciones[0].importe).toBe('number');
      expect(res.body.percepciones[0].importe).toBe(1234.56);
    });

    it('ignora conceptos con tipo distinto de P o D', async () => {
      mockNominaById(
        [{ num_cons: 1, rfc: 'TEST', nom_emp: 'Test' }],
        [
          { perc_ded: 'P', concepto: 'P01', importe: '1000', qna_ini: 202401, qna_fin: 202401 },
          { perc_ded: 'X', concepto: 'X99', importe: '500', qna_ini: 202401, qna_fin: 202401 },
        ]
      );

      const res = await request(app).get('/api/nomina/1');

      expect(res.body.percepciones).toHaveLength(1);
      expect(res.body.deducciones).toHaveLength(0);
    });

    it('retorna arrays vacíos cuando no hay conceptos', async () => {
      mockNominaById(
        [{ num_cons: 1, rfc: 'TEST', nom_emp: 'Test' }],
        []
      );

      const res = await request(app).get('/api/nomina/1');

      expect(res.body.percepciones).toEqual([]);
      expect(res.body.deducciones).toEqual([]);
    });
  });

  describe('errores', () => {
    it('retorna 500 cuando el pool lanza un error', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/api/nomina/1');

      expect(res.status).toBe(500);
    });
  });
});

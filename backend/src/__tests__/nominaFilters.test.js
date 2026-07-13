import { describe, it, expect } from 'vitest';
import { buildNominaFilters, edadExpression } from '../services/nominaFilters.js';

describe('buildNominaFilters', () => {
  it('debe devolver arrays vacíos para un query vacío', () => {
    const { conditions, params } = buildNominaFilters({});
    expect(conditions).toEqual([]);
    expect(params).toEqual([]);
  });

  it('debe generar filtro por RFC exacto', () => {
    const { conditions, params } = buildNominaFilters({ rfc: 'ABC123456XYZ' });
    expect(conditions).toEqual(['rfc = $1']);
    expect(params).toEqual(['ABC123456XYZ']);
  });

  it('debe combinar neto_min y neto_max con los placeholders correspondientes en orden', () => {
    const { conditions, params } = buildNominaFilters({ neto_min: '1500.50', neto_max: '5000' });
    expect(conditions).toEqual(['tot_net_cheque >= $1', 'tot_net_cheque <= $2']);
    expect(params).toEqual([1500.50, 5000.00]);
  });

  it('debe generar la cláusula EXISTS con concepto, tipo e importes', () => {
    const { conditions, params } = buildNominaFilters({
      concepto: 'P01',
      concepto_tipo: 'P',
      concepto_importe_min: '100',
      concepto_importe_max: '1000'
    });

    expect(conditions).toHaveLength(1);
    expect(conditions[0]).toContain('EXISTS (');
    expect(conditions[0]).toContain('nc.num_cons = nomina_registros.num_cons');
    expect(conditions[0]).toContain('nc.concepto = $1');
    expect(conditions[0]).toContain('nc.perc_ded = $2');
    expect(conditions[0]).toContain('nc.importe >= $3');
    expect(conditions[0]).toContain('nc.importe <= $4');

    expect(params).toEqual(['P01', 'P', 100.00, 1000.00]);
  });

  it('debe generar la cláusula de filtro por edad', () => {
    const { conditions, params } = buildNominaFilters({ edad_min: '30', edad_max: '50' });
    expect(conditions).toEqual([
      `${edadExpression} >= $1`,
      `${edadExpression} <= $2`
    ]);
    expect(params).toEqual([30, 50]);
  });

  it('debe manejar búsqueda general (search)', () => {
    const { conditions, params } = buildNominaFilters({ search: '  Jose  ' });
    expect(conditions).toEqual(['(rfc ILIKE $1 OR nom_emp ILIKE $2)']);
    expect(params).toEqual(['%Jose%', '%Jose%']);
  });

  it('debe parsear adecuadamente tipos de datos numéricos (ent_fed, unidad, subunidad, horas, nivel_sueldo, mot_mov)', () => {
    const { conditions, params } = buildNominaFilters({
      ent_fed: '15',
      unidad: '102',
      subunidad: '3',
      horas_min: '20',
      horas_max: '40',
      nivel_sueldo_min: '5',
      nivel_sueldo_max: '12',
      mot_mov: '6'
    });

    expect(conditions).toContain('ent_fed = $1');
    expect(conditions).toContain('unidad = $2');
    expect(conditions).toContain('subunidad = $3');
    expect(conditions).toContain('horas >= $4');
    expect(conditions).toContain('horas <= $5');
    expect(conditions).toContain('nivel_sueldo >= $6');
    expect(conditions).toContain('nivel_sueldo <= $7');
    expect(conditions).toContain('mot_mov = $8');

    expect(params).toEqual([15, 102, 3, 20, 40, 5, 12, 6]);
  });

  it('debe manejar filtros de Centro de Trabajo (ct_clasif, ct_id, ct_secuencial, ct_digito_ver, ct_search)', () => {
    const { conditions, params } = buildNominaFilters({
      ct_clasif: 'D',
      ct_id: '99',
      ct_secuencial: '123',
      ct_digito_ver: 'K',
      ct_search: '  ct_busqueda  '
    });

    expect(conditions).toContain('ct_clasif = $1');
    expect(conditions).toContain('ct_id = $2');
    expect(conditions).toContain('ct_secuencial = $3');
    expect(conditions).toContain('ct_digito_ver = $4');
    expect(conditions).toContain(`(
      ct_clasif ILIKE $5 OR 
      ct_id ILIKE $6 OR 
      CAST(ct_secuencial AS text) ILIKE $7
    )`);

    expect(params).toEqual([
      'D',
      '99',
      123,
      'K',
      '%ct_busqueda%',
      '%ct_busqueda%',
      '%ct_busqueda%'
    ]);
  });
});

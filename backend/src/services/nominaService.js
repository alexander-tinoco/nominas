import * as nominaRepository from '../repositories/nominaRepository.js';
import { buildNominaFilters } from './nominaFilters.js';

export const getNominas = async (query = {}) => {
  let { page = 1, limit = 20 } = query;

  // Normalizar paginación
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;

  // Construir filtros
  const { conditions, params } = buildNominaFilters(query);

  // Llamar al repositorio
  const { summary, data } = await nominaRepository.findAll({
    conditions,
    params,
    limit,
    offset
  });

  const total = summary.total;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    summary: {
      total,
      totalPercepciones: summary.total_percepciones,
      totalDeducciones: summary.total_deducciones,
      totalNeto: summary.total_neto
    },
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

export const getNominaById = async (numCons) => {
  const numConsInt = parseInt(numCons, 10);
  if (isNaN(numConsInt)) {
    const error = new Error("num_cons debe ser un valor entero válido");
    error.status = 400;
    throw error;
  }

  const { registro, conceptos } = await nominaRepository.findById(numConsInt);

  if (!registro) {
    return null;
  }

  // Separar percepciones de deducciones
  const percepciones = [];
  const deducciones = [];

  for (const row of conceptos) {
    if (row.perc_ded === 'P') {
      percepciones.push({
        concepto: row.concepto,
        importe: parseFloat(row.importe),
        qna_ini: row.qna_ini,
        qna_fin: row.qna_fin
      });
    } else if (row.perc_ded === 'D') {
      deducciones.push({
        concepto: row.concepto,
        importe: parseFloat(row.importe),
        qna_ini: row.qna_ini,
        qna_fin: row.qna_fin
      });
    }
  }

  return {
    ...registro,
    percepciones,
    deducciones
  };
};

export const exportNominasToCsv = async (query = {}) => {
  const { conditions, params } = buildNominaFilters(query);
  const rows = await nominaRepository.findForExport({ conditions, params });

  const headers = [
    'num_cons', 'rfc', 'nom_emp', 'ent_fed', 'ct_clasif', 'ct_id', 'ct_secuencial',
    'ct_digito_ver', 'cod_pago', 'unidad', 'subunidad', 'cat_puesto', 'horas',
    'cons_plaza', 'nivel_sueldo', 'mot_mov', 'qna_ini', 'qna_fin', 'qna_pago',
    'tot_perc_cheque', 'tot_ded_cheque', 'tot_net_cheque', 'edad'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map(h => escapeCsv(row[h]));
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

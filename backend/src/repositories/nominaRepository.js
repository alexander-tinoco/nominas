import pool from '../config/db.js';
import { edadExpression } from '../services/nominaFilters.js';

export const findAll = async ({ conditions, params, limit, offset }) => {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const summaryQuery = `
    SELECT 
      COUNT(*)::int AS total,
      COALESCE(SUM(tot_perc_cheque), 0)::float AS total_percepciones,
      COALESCE(SUM(tot_ded_cheque), 0)::float AS total_deducciones,
      COALESCE(SUM(tot_net_cheque), 0)::float AS total_neto
    FROM nomina_registros
    ${whereClause}
  `;

  const dataQuery = `
    SELECT *, 
           ${edadExpression} AS edad
    FROM nomina_registros
    ${whereClause}
    ORDER BY num_cons ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const [summaryResult, dataResult] = await Promise.all([
    pool.query(summaryQuery, params),
    pool.query(dataQuery, [...params, limit, offset])
  ]);

  return {
    summary: summaryResult.rows[0],
    data: dataResult.rows
  };
};

export const findById = async (numCons) => {
  const registroQuery = `
    SELECT *
    FROM nomina_registros
    WHERE num_cons = $1
  `;

  const conceptosQuery = `
    SELECT perc_ded, concepto, importe, qna_ini, qna_fin
    FROM nomina_conceptos
    WHERE num_cons = $1
    ORDER BY concepto ASC
  `;

  const [registroResult, conceptosResult] = await Promise.all([
    pool.query(registroQuery, [numCons]),
    pool.query(conceptosQuery, [numCons])
  ]);

  return {
    registro: registroResult.rows[0] || null,
    conceptos: conceptosResult.rows
  };
};

export const findForExport = async ({ conditions, params }) => {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT *, 
           ${edadExpression} AS edad
    FROM nomina_registros
    ${whereClause}
    ORDER BY num_cons ASC
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

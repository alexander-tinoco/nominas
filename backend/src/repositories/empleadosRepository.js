import pool from '../config/db.js';

export const findAndCount = async ({ searchPattern, limit, offset }) => {
  const countQuery = `
    SELECT COUNT(DISTINCT rfc) AS total
    FROM nomina_registros
    WHERE ($1::text IS NULL OR rfc ILIKE $1 OR nom_emp ILIKE $1)
  `;

  const dataQuery = `
    SELECT rfc, MAX(nom_emp) AS nom_emp
    FROM nomina_registros
    WHERE ($1::text IS NULL OR rfc ILIKE $1 OR nom_emp ILIKE $1)
    GROUP BY rfc
    ORDER BY nom_emp ASC
    LIMIT $2 OFFSET $3
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, [searchPattern]),
    pool.query(dataQuery, [searchPattern, limit, offset])
  ]);

  return {
    total: parseInt(countResult.rows[0].total, 10),
    rows: dataResult.rows
  };
};

export const findByRfc = async (rfc) => {
  const query = `
    SELECT *
    FROM nomina_registros
    WHERE rfc = $1
    ORDER BY qna_pago ASC, qna_ini ASC
  `;

  const result = await pool.query(query, [rfc]);
  return result.rows;
};

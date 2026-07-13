import pool from '../config/db.js';

export const findReportePorUnidad = async (qnaInt, includeSubunidad) => {
  let query;

  if (includeSubunidad) {
    query = `
      SELECT 
        CONCAT('U-', unidad, ' S-', subunidad) AS etiqueta,
        unidad,
        subunidad,
        SUM(tot_perc_cheque)::float AS total_percepciones,
        SUM(tot_ded_cheque)::float AS total_deducciones,
        SUM(tot_net_cheque)::float AS total_neto
      FROM nomina_registros
      WHERE qna_pago = $1
      GROUP BY unidad, subunidad
      ORDER BY total_neto DESC
    `;
  } else {
    query = `
      SELECT 
        CONCAT('Unidad ', unidad) AS etiqueta,
        unidad,
        SUM(tot_perc_cheque)::float AS total_percepciones,
        SUM(tot_ded_cheque)::float AS total_deducciones,
        SUM(tot_net_cheque)::float AS total_neto
      FROM nomina_registros
      WHERE qna_pago = $1
      GROUP BY unidad
      ORDER BY total_neto DESC
    `;
  }

  const result = await pool.query(query, [qnaInt]);
  return result.rows;
};

export const findReporteConceptos = async (pQnaStart, pQnaEnd) => {
  const query = `
    SELECT 
      CONCAT('C-', concepto, ' (', perc_ded, ')') AS etiqueta,
      concepto,
      perc_ded,
      SUM(importe)::float AS total_importe
    FROM nomina_conceptos
    WHERE ($1::int IS NULL OR qna_fin >= $1)
      AND ($2::int IS NULL OR qna_ini <= $2)
    GROUP BY concepto, perc_ded
    ORDER BY total_importe DESC
  `;

  const result = await pool.query(query, [pQnaStart, pQnaEnd]);
  return result.rows;
};

import pool from '../config/db.js';

// GET /api/reportes/por-unidad
export const getReportePorUnidad = async (req, res, next) => {
  try {
    const { qna, subunidad } = req.query;

    if (!qna) {
      return res.status(400).json({ error: "El parámetro de quincena '?qna=' es requerido (ej. ?qna=201806)" });
    }

    const qnaInt = parseInt(qna, 10);
    if (isNaN(qnaInt)) {
      return res.status(400).json({ error: "El parámetro 'qna' debe ser un número entero válido (formato AAAAQQ)" });
    }

    const includeSubunidad = subunidad === 'true';
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

    res.json({
      qna: qnaInt,
      groupedBySubunidad: includeSubunidad,
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reportes/conceptos
export const getReporteConceptos = async (req, res, next) => {
  try {
    const { qna_start, qna_end } = req.query;

    const pQnaStart = qna_start ? parseInt(qna_start, 10) : null;
    const pQnaEnd = qna_end ? parseInt(qna_end, 10) : null;

    if (qna_start && isNaN(pQnaStart)) {
      return res.status(400).json({ error: "El parámetro qna_start debe ser un entero válido" });
    }
    if (qna_end && isNaN(pQnaEnd)) {
      return res.status(400).json({ error: "El parámetro qna_end debe ser un entero válido" });
    }

    const query = `
      SELECT 
        CONCAT('C-', concepto, ' (', perc_ded, ')') AS etiqueta,
        concepto,
        perc_ded,
        SUM(importe)::float AS total_importe
      FROM nomina_conceptos
      WHERE ($1::int IS NULL OR qna_ini >= $1)
        AND ($2::int IS NULL OR qna_fin <= $2)
      GROUP BY concepto, perc_ded
      ORDER BY total_importe DESC
    `;

    const result = await pool.query(query, [pQnaStart, pQnaEnd]);

    res.json({
      filters: {
        qna_start: pQnaStart,
        qna_end: pQnaEnd
      },
      data: result.rows
    });
  } catch (err) {
    next(err);
  }
};

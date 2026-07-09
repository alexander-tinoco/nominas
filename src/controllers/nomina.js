import pool from '../config/db.js';

// GET /api/nomina
export const getNominas = async (req, res, next) => {
  try {
    let { unidad, subunidad, cat_puesto, qna_ini, qna_fin, page = 1, limit = 20 } = req.query;

    // Normalizar paginación
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (page - 1) * limit;

    // Castear tipos de los filtros si existen
    const pUnidad = unidad ? parseInt(unidad, 10) : null;
    const pSubunidad = subunidad ? parseInt(subunidad, 10) : null;
    const pCatPuesto = cat_puesto ? cat_puesto.trim() : null;
    const pQnaIni = qna_ini ? parseInt(qna_ini, 10) : null;
    const pQnaFin = qna_fin ? parseInt(qna_fin, 10) : null;

    // Consultas SQL
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM nomina_registros
      WHERE ($1::int IS NULL OR unidad = $1)
        AND ($2::int IS NULL OR subunidad = $2)
        AND ($3::text IS NULL OR cat_puesto = $3)
        AND ($4::int IS NULL OR qna_ini = $4)
        AND ($5::int IS NULL OR qna_fin = $5)
    `;

    const dataQuery = `
      SELECT *
      FROM nomina_registros
      WHERE ($1::int IS NULL OR unidad = $1)
        AND ($2::int IS NULL OR subunidad = $2)
        AND ($3::text IS NULL OR cat_puesto = $3)
        AND ($4::int IS NULL OR qna_ini = $4)
        AND ($5::int IS NULL OR qna_fin = $5)
      ORDER BY num_cons ASC
      LIMIT $6 OFFSET $7
    `;

    const queryParams = [pUnidad, pSubunidad, pCatPuesto, pQnaIni, pQnaFin];

    // Ejecutar ambas consultas en paralelo
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, queryParams),
      pool.query(dataQuery, [...queryParams, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/nomina/:num_cons
export const getNominaById = async (req, res, next) => {
  try {
    const numCons = parseInt(req.params.num_cons, 10);
    if (isNaN(numCons)) {
      return res.status(400).json({ error: "num_cons debe ser un valor entero válido" });
    }

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

    if (registroResult.rows.length === 0) {
      return res.status(404).json({ error: `Registro de nómina con num_cons ${numCons} no encontrado` });
    }

    const registro = registroResult.rows[0];

    // Separar percepciones de deducciones
    const percepciones = [];
    const deducciones = [];

    for (const row of conceptosResult.rows) {
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

    res.json({
      ...registro,
      percepciones,
      deducciones
    });
  } catch (err) {
    next(err);
  }
};

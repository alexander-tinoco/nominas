import pool from '../config/db.js';

// GET /api/empleados
export const getEmpleados = async (req, res, next) => {
  try {
    let { search, page = 1, limit = 20 } = req.query;

    // Normalizar paginación
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (page - 1) * limit;

    // Formatear búsqueda para ILIKE
    const searchPattern = search ? `%${search.trim()}%` : null;

    // Consultas SQL
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

    // Ejecutar ambas consultas en paralelo
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [searchPattern]),
      pool.query(dataQuery, [searchPattern, limit, offset])
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

// GET /api/empleados/:rfc
export const getEmpleadoByRfc = async (req, res, next) => {
  try {
    const { rfc } = req.params;

    const query = `
      SELECT *
      FROM nomina_registros
      WHERE rfc = $1
      ORDER BY qna_pago ASC, qna_ini ASC
    `;

    const result = await pool.query(query, [rfc]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Empleado con RFC ${rfc} no encontrado` });
    }

    res.json({
      rfc,
      nombre: result.rows[0].nom_emp,
      historial: result.rows
    });
  } catch (err) {
    next(err);
  }
};

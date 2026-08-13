import pool from '../config/db.js';

export const insertLog = async ({ usuario, evento, nivel, detalle }) => {
  const query = `
    INSERT INTO logs_seguridad (usuario, evento, nivel, detalle)
    VALUES ($1, $2, $3, $4)
    RETURNING id, fecha_hora, usuario, evento, nivel, detalle
  `;

  const result = await pool.query(query, [usuario, evento, nivel, detalle ? JSON.stringify(detalle) : null]);
  return result.rows[0];
};

export const findRecent = async ({ evento, nivel, usuario, limit = 50 } = {}) => {
  const query = `
    SELECT id, fecha_hora, usuario, evento, nivel, detalle
    FROM logs_seguridad
    WHERE ($1::text IS NULL OR evento = $1)
      AND ($2::text IS NULL OR nivel = $2)
      AND ($3::text IS NULL OR usuario = $3)
    ORDER BY fecha_hora DESC
    LIMIT $4
  `;

  const result = await pool.query(query, [evento ?? null, nivel ?? null, usuario ?? null, limit]);
  return result.rows;
};

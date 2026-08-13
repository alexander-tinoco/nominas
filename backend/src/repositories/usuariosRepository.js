import pool from '../config/db.js';

export const findByEmail = async (email) => {
  const query = `
    SELECT id, email, password_hash, rol, nombre, created_at
    FROM usuarios
    WHERE email = $1
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

export const updateCampoPerfil = async (id, campo, valor) => {
  const CAMPOS_EDITABLES = ['nombre', 'email'];
  if (!CAMPOS_EDITABLES.includes(campo)) {
    throw Object.assign(new Error(`Campo de perfil no editable: ${campo}`), { status: 400 });
  }

  const query = `
    UPDATE usuarios
    SET ${campo} = $1
    WHERE id = $2
    RETURNING id, email, rol, nombre, created_at
  `;

  const result = await pool.query(query, [valor, id]);
  return result.rows[0] || null;
};

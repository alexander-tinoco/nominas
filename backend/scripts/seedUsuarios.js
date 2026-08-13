// Script de un solo uso para crear usuarios de prueba (login) en entornos de desarrollo.
// Uso: npm run seed:usuarios
import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

const USUARIOS_DEMO = [
  { email: 'admin@nominas.local', password: 'Practica2026Admin!', rol: 'admin', nombre: 'Administrador Demo' },
  { email: 'usuario@nominas.local', password: 'Practica2026User!', rol: 'usuario', nombre: 'Usuario Demo' },
];

const seed = async () => {
  for (const { email, password, rol, nombre } of USUARIOS_DEMO) {
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO usuarios (email, password_hash, rol, nombre)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, rol = $3, nombre = $4`,
      [email, password_hash, rol, nombre]
    );

    console.log(`[Seed] Usuario listo: ${email} (rol: ${rol})`);
  }

  await pool.end();
};

seed().catch((err) => {
  console.error('[Seed] Error creando usuarios de prueba:', err);
  process.exit(1);
});

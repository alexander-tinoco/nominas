import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const pool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
  max: 20, // Número máximo de conexiones simultáneas en el pool
  idleTimeoutMillis: 30000, // Tiempo para cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // Tiempo límite para establecer conexión
});

// Probar la conexión al importar este módulo
try {
  const client = await pool.connect();
  const res = await client.query('SELECT NOW() AS current_time, 1 AS test_val');
  console.log(`[Database] Conexión establecida correctamente con PostgreSQL. Test value: ${res.rows[0].test_val}, Server time: ${res.rows[0].current_time}`);
  client.release();
} catch (err) {
  console.error('[Database] Error crítico conectando a PostgreSQL:', err.message);
}

export default pool;

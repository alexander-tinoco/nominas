import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_NAME || 'nominas',
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

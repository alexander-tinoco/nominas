import { cleanEnv, port, str } from 'envalid';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env local si existe
dotenv.config();

const env = cleanEnv(process.env, {
  PORT: port({
    default: 3000,
    desc: 'Puerto de escucha del servidor Express HTTP',
  }),
  PGHOST: str({
    default: 'localhost',
    desc: 'Dirección o nombre del servidor PostgreSQL',
  }),
  PGPORT: port({
    default: 5433,
    desc: 'Puerto de conexión del servidor PostgreSQL',
  }),
  PGUSER: str({
    default: 'postgres',
    desc: 'Nombre del usuario administrador de PostgreSQL',
  }),
  PGPASSWORD: str({
    default: 'postgres_password',
    desc: 'Contraseña para la autenticación en PostgreSQL',
  }),
  PGDATABASE: str({
    default: 'nominas',
    desc: 'Nombre de la base de datos relacional para consultar',
  }),
  CORS_ORIGIN: str({
    default: '*',
    desc: 'Orígenes web permitidos para el intercambio de recursos (CORS)',
  }),
  LOG_LEVEL: str({
    default: 'info',
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
    desc: 'Nivel mínimo de logger estructurado Pino',
  }),
});

export default env;

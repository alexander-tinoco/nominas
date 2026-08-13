import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import loggerMiddleware from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import env from './config/env.js';
import pool from './config/db.js';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js';

// Importar rutas
import empleadosRoutes from './routes/empleados.js';
import nominaRoutes from './routes/nomina.js';
import reportesRoutes from './routes/reportes.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import { setupSwagger } from './config/swagger.js';

const app = express();

// 0. Registrar el recolector de métricas de Prometheus al inicio
app.use(metricsMiddleware);

// Configurar Swagger API Docs
setupSwagger(app);

// 1. Cabeceras HTTP seguras con Helmet (Configurando CSP detallada para Swagger UI)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "validator.swagger.io"],
      connectSrc: ["'self'"],
    },
  },
}));

// 2. Configurar CORS (Orígenes cruzados restringidos a CORS_ORIGIN)
// Con autenticación basada en cookies, el navegador exige credentials:true
// y un origen explícito (nunca "*") en la respuesta. Si CORS_ORIGIN="*",
// se refleja dinámicamente el origen de la petición (origin: true) en vez
// de enviar el comodín literal, que los navegadores rechazan junto a cookies.
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
}));

// 3. Limitadores de peticiones granulares para prevenir ataques DoS
// Limitador general para empleados y consultas básicas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Limitador moderado para nóminas (búsquedas dinámicas SQL)
const nominaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas de nómina desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Limitador extra-estricto para reportes complejos (agregaciones pesadas de base de datos)
const reportesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de generación de reportes excedido desde esta IP, por favor espere 15 minutos.' }
});

// Limitador estricto para login (mitigar fuerza bruta, además del bloqueo por usuario)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Parsear cuerpo JSON
app.use(express.json());

// Parsear cookies (necesario para leer el JWT de sesión httpOnly)
app.use(cookieParser());

// Registrar logs estructurados para cada petición HTTP (Pino-HTTP)
app.use(loggerMiddleware);

// Endpoint de salud (Health Check) mejorado con estado de DB, uptime y uso de memoria
app.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'unhealthy';
  }

  const memoryUsage = process.memoryUsage();
  const isHealthy = dbStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date(),
    uptime: process.uptime(),
    db: dbStatus,
    memory: {
      rss: `${Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100} MB`,
      heapTotal: `${Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100} MB`,
      heapUsed: `${Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100} MB`,
      external: `${Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100} MB`,
    }
  });
});

// Endpoint para exponer métricas compatibles con Prometheus
app.get('/metrics', metricsEndpoint);

// Autenticación (login público con su propio limitador; el resto de sub-rutas exige sesión)
app.use('/api/auth', authLimiter, authRoutes);

// Rutas de la API con sus respectivos limitadores de tasa aplicados.
// Requieren sesión iniciada (cualquier rol); las peticiones sin cookie válida
// quedan registradas como acceso no autorizado (Práctica 1 y 5).
app.use('/api/empleados', generalLimiter, requireAuth, empleadosRoutes);
app.use('/api/nomina', nominaLimiter, requireAuth, nominaRoutes);
app.use('/api/reportes', reportesLimiter, requireAuth, reportesRoutes);

// Rutas administrativas: exigen sesión Y rol admin (el endpoint de caché
// además conserva su propio token x-admin-token como segunda capa)
app.use('/api/admin', requireAuth, requireRole('admin'), adminRoutes);

// Manejador de errores de Sentry (debe ir antes de nuestro errorHandler personalizado)
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Middleware centralizado de manejo de errores (debe estar al final)
app.use(errorHandler);

export default app;

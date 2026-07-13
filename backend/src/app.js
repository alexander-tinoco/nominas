import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import loggerMiddleware from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';
import pool from './config/db.js';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.js';

// Importar rutas
import empleadosRoutes from './routes/empleados.js';
import nominaRoutes from './routes/nomina.js';
import reportesRoutes from './routes/reportes.js';
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
app.use(cors({
  origin: env.CORS_ORIGIN,
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

// Parsear cuerpo JSON
app.use(express.json());

// Registrar logs estructurados para cada petición HTTP (Pino-HTTP)
app.use(loggerMiddleware);

// Endpoint de salud (Health Check) mejorado con estado de DB, uptime y uso de memoria
app.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    await pool.query('SELECT 1');
  } catch (err) {
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

// Rutas de la API con sus respectivos limitadores de tasa aplicados
app.use('/api/empleados', generalLimiter, empleadosRoutes);
app.use('/api/nomina', nominaLimiter, nominaRoutes);
app.use('/api/reportes', reportesLimiter, reportesRoutes);

// Manejador de errores de Sentry (debe ir antes de nuestro errorHandler personalizado)
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Middleware centralizado de manejo de errores (debe estar al final)
app.use(errorHandler);

export default app;

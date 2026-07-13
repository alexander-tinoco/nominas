import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import loggerMiddleware from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import env from './config/env.js';

// Importar rutas
import empleadosRoutes from './routes/empleados.js';
import nominaRoutes from './routes/nomina.js';
import reportesRoutes from './routes/reportes.js';
import { setupSwagger } from './config/swagger.js';

const app = express();

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
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 150, // Límite de 150 peticiones por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Limitador moderado para nóminas (búsquedas dinámicas SQL)
const nominaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80, // Límite de 80 consultas de nómina
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas de nómina desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Limitador extra-estricto para reportes complejos (agregaciones pesadas de base de datos)
const reportesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Límite de 30 solicitudes de reportes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de generación de reportes excedido desde esta IP, por favor espere 15 minutos.' }
});

// Parsear cuerpo JSON
app.use(express.json());

// Registrar logs estructurados para cada petición HTTP (Pino-HTTP)
app.use(loggerMiddleware);

// Endpoint de salud (Health Check) libre de rate limit y logging pesado
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Rutas de la API con sus respectivos limitadores de tasa aplicados
app.use('/api/empleados', generalLimiter, empleadosRoutes);
app.use('/api/nomina', nominaLimiter, nominaRoutes);
app.use('/api/reportes', reportesLimiter, reportesRoutes);

// Middleware centralizado de manejo de errores (debe estar al final)
app.use(errorHandler);

export default app;

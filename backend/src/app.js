import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import loggerMiddleware from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Importar rutas
import empleadosRoutes from './routes/empleados.js';
import nominaRoutes from './routes/nomina.js';
import reportesRoutes from './routes/reportes.js';
import { setupSwagger } from './config/swagger.js';

const app = express();

// Configurar Swagger API Docs
setupSwagger(app);

// 1. Cabeceras HTTP seguras con Helmet
app.use(helmet());

// 2. Configurar CORS (Orígenes cruzados restringidos si se define CORS_ORIGIN)
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  optionsSuccessStatus: 200
}));

// 3. Limitador de peticiones (Rate Limit) para prevenir abusos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: 150, // Límite de 150 peticiones por IP por ventana
  standardHeaders: true, // Retorna info de rate limit en cabeceras estándar
  legacyHeaders: false, // Deshabilita cabeceras antiguas X-RateLimit-*
  message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Aplicar rate limit a todos los endpoints de la API (excepto el de salud)
app.use('/api', limiter);

// Parsear cuerpo JSON
app.use(express.json());

// Registrar logs estructurados para cada petición HTTP (Pino-HTTP)
app.use(loggerMiddleware);

// Endpoint de salud (Health Check) libre de rate limit y logging pesado
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Rutas de la API
app.use('/api/empleados', empleadosRoutes);
app.use('/api/nomina', nominaRoutes);
app.use('/api/reportes', reportesRoutes);

// Middleware centralizado de manejo de errores (debe estar al final)
app.use(errorHandler);

export default app;

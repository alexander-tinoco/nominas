import express from 'express';
import cors from 'cors';
import loggerMiddleware from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Importar rutas
import empleadosRoutes from './routes/empleados.js';
import nominaRoutes from './routes/nomina.js';
import reportesRoutes from './routes/reportes.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Registrar logs estructurados para cada petición HTTP
app.use(loggerMiddleware);

// Endpoint de salud
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

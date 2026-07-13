import env from './config/env.js';
import app from './app.js';
import { logger } from './middleware/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Servidor Express escuchando en el puerto ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
});

// Manejo de apagado elegante (graceful shutdown)
const gracefulShutdown = () => {
  logger.info('Iniciando apagado elegante del servidor HTTP...');
  server.close(() => {
    logger.info('Servidor HTTP cerrado.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

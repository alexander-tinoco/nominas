import pinoHttp from 'pino-http';
import pino from 'pino';

// Crear el logger base de pino
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // En producción produce JSON puro. Para desarrollo, podríamos usar pretty si estuviera instalado, 
  // pero manteniéndolo ligero y simple, usamos el JSON estructurado nativo de Pino.
});

// Middleware pino-http
const loggerMiddleware = pinoHttp({
  logger,
  // Definir niveles de log según el status HTTP
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Reducir información serializada del request para no saturar los logs
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

export default loggerMiddleware;

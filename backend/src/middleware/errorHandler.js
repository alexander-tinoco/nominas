import { logger } from './logger.js';

// Middleware de manejo de errores centralizado
const errorHandler = (err, req, res, next) => {
  // Registrar el error con Pino
  logger.error({
    msg: "Error capturado por el middleware de Express",
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code, // Código de error de PostgreSQL
      detail: err.detail, // Detalle de PostgreSQL
    }
  });

  const isDatabaseError = err.code !== undefined;
  
  // Responder de forma consistente
  const statusCode = err.status || (isDatabaseError ? 500 : 500);
  const errorMessage = isDatabaseError 
    ? "Error interno de base de datos" 
    : (err.message || "Error interno del servidor");

  res.status(statusCode).json({
    error: errorMessage
  });
};

export default errorHandler;

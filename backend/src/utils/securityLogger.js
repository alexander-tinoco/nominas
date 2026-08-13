import { logger } from '../middleware/logger.js';
import * as logsSeguridadRepository from '../repositories/logsSeguridadRepository.js';

// Mapeo de eventos de seguridad a niveles de severidad (Práctica 7)
const SEVERITY_BY_EVENT = {
  login_exitoso: 'INFO',
  logout: 'INFO',
  perfil_actualizado: 'INFO',
  login_fallido: 'WARNING',
  acceso_no_autorizado: 'WARNING',
  acceso_denegado_rol: 'WARNING',
  cuenta_bloqueada_temporalmente: 'ERROR',
  token_verificado: 'DEBUG',
};

const PINO_METHOD_BY_NIVEL = {
  INFO: 'info',
  WARNING: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
};

// Campos que nunca deben llegar a un log, ni siquiera en el detalle estructurado (Práctica 3)
const CAMPOS_SENSIBLES = ['password', 'password_hash', 'token', 'cookie'];

const limpiarDetalle = (detalle) => {
  if (!detalle || typeof detalle !== 'object') return detalle;
  const limpio = { ...detalle };
  for (const campo of CAMPOS_SENSIBLES) {
    delete limpio[campo];
  }
  return limpio;
};

/**
 * Registra un evento de seguridad tanto en la tabla logs_seguridad (Práctica 6)
 * como en el logger estructurado de la aplicación (Pino), con el nivel de
 * severidad correspondiente (Práctica 7).
 */
export const logSecurityEvent = async ({ usuario = 'anonimo', evento, nivel, detalle }) => {
  const nivelFinal = nivel || SEVERITY_BY_EVENT[evento] || 'INFO';
  const detalleSeguro = limpiarDetalle(detalle);
  const pinoMethod = PINO_METHOD_BY_NIVEL[nivelFinal] || 'info';

  logger[pinoMethod]({ msg: `[Seguridad] ${evento}`, usuario, evento, nivel: nivelFinal, detalle: detalleSeguro });

  try {
    await logsSeguridadRepository.insertLog({ usuario, evento, nivel: nivelFinal, detalle: detalleSeguro });
  } catch (err) {
    logger.warn(`[Seguridad] No se pudo persistir el evento "${evento}" en logs_seguridad:`, err.message);
  }
};

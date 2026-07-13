import Redis from 'ioredis';
import env from './env.js';
import { logger } from '../middleware/logger.js';

let redisClient = null;

if (process.env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false, // Evitar encolar peticiones si Redis se cae
    });

    redisClient.on('connect', () => {
      logger.info('[Redis] Conexión establecida correctamente con el servidor de caché.');
    });

    redisClient.on('error', (err) => {
      logger.error('[Redis] Error de conexión o comunicación:', err.message);
    });
  } catch (err) {
    logger.error('[Redis] Error crítico al inicializar el cliente:', err.message);
  }
}

/**
 * Helper para obtener valores de caché con resiliencia.
 */
export const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn(`[Redis] Falló obtener caché para key "${key}":`, err.message);
    return null;
  }
};

/**
 * Helper para guardar valores en caché con un tiempo de expiración (TTL).
 */
export const setCache = async (key, value, ttlSeconds = 600) => {
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`[Redis] Falló guardar caché para key "${key}":`, err.message);
  }
};

/**
 * Helper para invalidar caché por patrón o clave exacta.
 */
export const invalidateCachePattern = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`[Redis] Caché invalidada para patrón "${pattern}". Claves eliminadas: ${keys.length}`);
    }
  } catch (err) {
    logger.warn(`[Redis] Falló invalidar caché para patrón "${pattern}":`, err.message);
  }
};

export default redisClient;

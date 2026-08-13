import { Router } from 'express';
import { invalidateCachePattern } from '../config/redis.js';
import env from '../config/env.js';
import * as logsSeguridadRepository from '../repositories/logsSeguridadRepository.js';

const router = Router();

router.post('/cache/invalidate', async (req, res, next) => {
  try {
    const token = req.headers['x-admin-token'];
    if (!token || token !== env.ADMIN_TOKEN) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    await invalidateCachePattern('reportes:*');
    return res.json({ message: 'Caché invalidada correctamente' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/admin/logs-seguridad:
 *   get:
 *     summary: Consultar la bitácora de eventos de seguridad
 *     description: Retorna las entradas más recientes de logs_seguridad (login, accesos denegados, auditoría de cambios de perfil, etc). Restringido al rol "admin".
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: query
 *         name: evento
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de evento (ej. login_fallido).
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *           enum: [INFO, WARNING, ERROR, DEBUG]
 *         description: Filtrar por nivel de severidad.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Listado de eventos de seguridad recientes.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: No tiene el rol requerido (admin).
 */
router.get('/logs-seguridad', async (req, res, next) => {
  try {
    const { evento, nivel, limit } = req.query;
    const logs = await logsSeguridadRepository.findRecent({
      evento: evento || undefined,
      nivel: nivel || undefined,
      limit: limit ? Number(limit) : 50
    });
    res.json({ data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;

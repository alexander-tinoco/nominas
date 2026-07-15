import { Router } from 'express';
import { invalidateCachePattern } from '../config/redis.js';
import env from '../config/env.js';

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

export default router;

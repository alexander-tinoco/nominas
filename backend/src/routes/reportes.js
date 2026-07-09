import { Router } from 'express';
import { getReportePorUnidad, getReporteConceptos } from '../controllers/reportes.js';

const router = Router();

// Rutas de reportes
router.get('/por-unidad', getReportePorUnidad);
router.get('/conceptos', getReporteConceptos);

export default router;

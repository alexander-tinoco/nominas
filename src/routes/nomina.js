import { Router } from 'express';
import { getNominas, getNominaById } from '../controllers/nomina.js';

const router = Router();

// Rutas de nómina
router.get('/', getNominas);
router.get('/:num_cons', getNominaById);

export default router;

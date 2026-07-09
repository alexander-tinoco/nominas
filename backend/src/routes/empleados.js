import { Router } from 'express';
import { getEmpleados, getEmpleadoByRfc } from '../controllers/empleados.js';

const router = Router();

// Rutas de empleados
router.get('/', getEmpleados);
router.get('/:rfc', getEmpleadoByRfc);

export default router;

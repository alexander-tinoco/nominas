import { Router } from 'express';
import { getEmpleados, getEmpleadoByRfc } from '../controllers/empleados.js';
import { validateRequest } from '../middlewares/validate.js';
import { getEmpleadosSchema } from '../schemas/nominaSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/empleados:
 *   get:
 *     summary: Obtener lista paginada de empleados
 *     description: Retorna un listado de empleados registrados en la base de datos de nómina, ordenados alfabéticamente por nombre. Admite paginación y búsqueda parcial.
 *     tags:
 *       - Empleados
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda por nombre o RFC parcial.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de registros por página (máximo 100).
 *     responses:
 *       200:
 *         description: Listado de empleados obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rfc:
 *                         type: string
 *                         example: LOAA880101ABC
 *                       nom_emp:
 *                         type: string
 *                         example: ANA LOPEZ
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         description: Error interno del servidor o de base de datos.
 */
router.get('/', validateRequest(getEmpleadosSchema), getEmpleados);

/**
 * @openapi
 * /api/empleados/{rfc}:
 *   get:
 *     summary: Obtener el historial detallado de un empleado por RFC
 *     description: Retorna el historial de nóminas de un empleado asociado al RFC especificado.
 *     tags:
 *       - Empleados
 *     parameters:
 *       - in: path
 *         name: rfc
 *         required: true
 *         schema:
 *           type: string
 *         description: RFC del empleado a consultar.
 *     responses:
 *       200:
 *         description: Información del empleado e historial contable recuperados con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rfc:
 *                   type: string
 *                   example: LOAA880101ABC
 *                 nombre:
 *                   type: string
 *                   example: ANA LOPEZ
 *                 historial:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: El empleado con el RFC especificado no fue encontrado.
 *       500:
 *         description: Error interno del servidor o de base de datos.
 */
router.get('/:rfc', getEmpleadoByRfc);

export default router;

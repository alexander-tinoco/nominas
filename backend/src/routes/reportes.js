import { Router } from 'express';
import { getReportePorUnidad, getReporteConceptos } from '../controllers/reportes.js';
import { validateRequest } from '../middlewares/validate.js';
import { getReportePorUnidadSchema, getReporteConceptosSchema } from '../schemas/nominaSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/reportes/por-unidad:
 *   get:
 *     summary: Obtener reporte financiero agrupado por unidad o subunidad
 *     description: Retorna sumatorias acumuladas de percepciones, deducciones y líquido neto para una quincena contable, agrupadas por unidad (adscripción) o subunidad.
 *     tags:
 *       - Reportes
 *     parameters:
 *       - in: query
 *         name: qna
 *         required: true
 *         schema:
 *           type: integer
 *         description: Quincena a consultar (formato AAAAQQ, ej. 201806).
 *       - in: query
 *         name: subunidad
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Si es 'true', agrupa y desglosa por subunidad organizativa.
 *     responses:
 *       200:
 *         description: Reporte contable por unidades generado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qna:
 *                   type: integer
 *                   example: 201806
 *                 groupedBySubunidad:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       etiqueta:
 *                         type: string
 *                         example: Unidad 1
 *                       unidad:
 *                         type: string
 *                         example: "1"
 *                       subunidad:
 *                         type: string
 *                         example: "10"
 *                       total_percepciones:
 *                         type: number
 *                         example: 500000.50
 *                       total_deducciones:
 *                         type: number
 *                         example: 80000.00
 *                       total_neto:
 *                         type: number
 *                         example: 420000.50
 *       400:
 *         description: Parámetro qna ausente o inválido.
 *       500:
 *         description: Error interno del servidor o de base de datos.
 */
router.get('/por-unidad', validateRequest(getReportePorUnidadSchema), getReportePorUnidad);

/**
 * @openapi
 * /api/reportes/conceptos:
 *   get:
 *     summary: Obtener reporte contable global de conceptos
 *     description: Retorna los acumulados totales monetarios para cada concepto de nómina en un rango de quincenas o de manera global.
 *     tags:
 *       - Reportes
 *     parameters:
 *       - in: query
 *         name: qna_start
 *         schema:
 *           type: integer
 *         description: Quincena inicial del rango (formato AAAAQQ).
 *       - in: query
 *         name: qna_end
 *         schema:
 *           type: integer
 *         description: Quincena final del rango (formato AAAAQQ).
 *     responses:
 *       200:
 *         description: Reporte de conceptos acumulados generado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filters:
 *                   type: object
 *                   properties:
 *                     qna_start:
 *                       type: integer
 *                       nullable: true
 *                       example: 201801
 *                     qna_end:
 *                       type: integer
 *                       nullable: true
 *                       example: 201812
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       etiqueta:
 *                         type: string
 *                         example: C-001 (P)
 *                       concepto:
 *                         type: string
 *                         example: "001"
 *                       perc_ded:
 *                         type: string
 *                         example: "P"
 *                       total_importe:
 *                         type: number
 *                         example: 12500000.00
 *       400:
 *         description: Parámetros de quincena inicial o final inválidos.
 *       500:
 *         description: Error interno del servidor o de base de datos.
 */
router.get('/conceptos', validateRequest(getReporteConceptosSchema), getReporteConceptos);

export default router;

import { Router } from 'express';
import { getNominas, getNominaById, exportNominas } from '../controllers/nomina.js';
import { validateRequest } from '../middlewares/validate.js';
import { getNominaSchema, getNominaByIdSchema } from '../schemas/nominaSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/nomina:
 *   get:
 *     summary: Consultar recibos de nómina con filtros estructurados y acumulados
 *     description: Retorna un listado paginado de recibos de nómina (plazas contables) junto con los acumulados dinámicos contables (summary) calculados en base a los filtros aplicados.
 *     tags:
 *       - Nómina
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda general por RFC o nombre parcial de empleado.
 *       - in: query
 *         name: rfc
 *         schema:
 *           type: string
 *         description: Filtrar por RFC exacto del empleado.
 *       - in: query
 *         name: nom_emp
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de empleado (coincidencia parcial ILIKE).
 *       - in: query
 *         name: ent_fed
 *         schema:
 *           type: integer
 *         description: Código de entidad federativa.
 *       - in: query
 *         name: unidad
 *         schema:
 *           type: integer
 *         description: Código numérico de adscripción de unidad.
 *       - in: query
 *         name: subunidad
 *         schema:
 *           type: integer
 *         description: Código numérico de adscripción de subunidad.
 *       - in: query
 *         name: cat_puesto
 *         schema:
 *           type: string
 *         description: Categoría/Clave del puesto.
 *       - in: query
 *         name: ct_clasif
 *         schema:
 *           type: string
 *         description: Clasificación del Centro de Trabajo.
 *       - in: query
 *         name: ct_id
 *         schema:
 *           type: string
 *         description: ID del Centro de Trabajo.
 *       - in: query
 *         name: ct_secuencial
 *         schema:
 *           type: integer
 *         description: Número secuencial del Centro de Trabajo.
 *       - in: query
 *         name: ct_digito_ver
 *         schema:
 *           type: string
 *         description: Dígito verificador del Centro de Trabajo.
 *       - in: query
 *         name: ct_search
 *         schema:
 *           type: string
 *         description: Búsqueda dinámica en columnas de Centro de Trabajo.
 *       - in: query
 *         name: qna_pago
 *         schema:
 *           type: integer
 *         description: Quincena de pago contable exacta.
 *       - in: query
 *         name: qna_pago_min
 *         schema:
 *           type: integer
 *         description: Límite inferior de la quincena de pago.
 *       - in: query
 *         name: qna_pago_max
 *         schema:
 *           type: integer
 *         description: Límite superior de la quincena de pago.
 *       - in: query
 *         name: qna_ini
 *         schema:
 *           type: integer
 *         description: Quincena inicial de vigencia del registro.
 *       - in: query
 *         name: qna_fin
 *         schema:
 *           type: integer
 *         description: Quincena final de vigencia del registro.
 *       - in: query
 *         name: neto_min
 *         schema:
 *           type: number
 *         description: Importe líquido neto mínimo recibido.
 *       - in: query
 *         name: neto_max
 *         schema:
 *           type: number
 *         description: Importe líquido neto máximo recibido.
 *       - in: query
 *         name: perc_min
 *         schema:
 *           type: number
 *         description: Total de percepciones mínimo en el recibo.
 *       - in: query
 *         name: perc_max
 *         schema:
 *           type: number
 *         description: Total de percepciones máximo en el recibo.
 *       - in: query
 *         name: ded_min
 *         schema:
 *           type: number
 *         description: Total de deducciones mínimo en el recibo.
 *       - in: query
 *         name: ded_max
 *         schema:
 *           type: number
 *         description: Total de deducciones máximo en el recibo.
 *       - in: query
 *         name: horas_min
 *         schema:
 *           type: integer
 *         description: Cantidad mínima de horas laborales.
 *       - in: query
 *         name: horas_max
 *         schema:
 *           type: integer
 *         description: Cantidad máxima de horas laborales.
 *       - in: query
 *         name: nivel_sueldo_min
 *         schema:
 *           type: integer
 *         description: Nivel de sueldo mínimo.
 *       - in: query
 *         name: nivel_sueldo_max
 *         schema:
 *           type: integer
 *         description: Nivel de sueldo máximo.
 *       - in: query
 *         name: mot_mov
 *         schema:
 *           type: integer
 *         description: Código de motivo de movimiento contable.
 *       - in: query
 *         name: edad_min
 *         schema:
 *           type: integer
 *         description: Edad mínima del personal calculada dinámicamente.
 *       - in: query
 *         name: edad_max
 *         schema:
 *           type: integer
 *         description: Edad máxima del personal calculada dinámicamente.
 *       - in: query
 *         name: concepto
 *         schema:
 *           type: string
 *         description: Código de concepto específico en detalles asociados.
 *       - in: query
 *         name: concepto_tipo
 *         schema:
 *           type: string
 *           enum: [P, D]
 *         description: Filtrar por tipo de concepto asociado (Percepción/Deducción).
 *       - in: query
 *         name: concepto_importe_min
 *         schema:
 *           type: number
 *         description: Importe mínimo del concepto asociado.
 *       - in: query
 *         name: concepto_importe_max
 *         schema:
 *           type: number
 *         description: Importe máximo del concepto asociado.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Registros por página.
 *     responses:
 *       200:
 *         description: Registros contables filtrados y métricas acumuladas recuperados correctamente.
 *       500:
 *         description: Error interno del servidor o de base de datos.
 */
router.get('/', validateRequest(getNominaSchema), getNominas);

/**
 * @openapi
 * /api/nomina/export:
 *   get:
 *     summary: Exportar recibos de nómina a formato CSV
 *     description: Genera y descarga un archivo CSV con todos los registros de nómina que coincidan con los filtros dinámicos provistos (sin paginación).
 *     tags:
 *       - Nómina
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda general por RFC o nombre parcial.
 *       - in: query
 *         name: rfc
 *         schema:
 *           type: string
 *       - in: query
 *         name: nom_emp
 *         schema:
 *           type: string
 *       - in: query
 *         name: ent_fed
 *         schema:
 *           type: integer
 *       - in: query
 *         name: unidad
 *         schema:
 *           type: integer
 *       - in: query
 *         name: subunidad
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cat_puesto
 *         schema:
 *           type: string
 *       - in: query
 *         name: qna_pago
 *         schema:
 *           type: integer
 *       - in: query
 *         name: neto_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: neto_max
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Archivo CSV generado con éxito.
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Error de base de datos o interno.
 */
router.get('/export', validateRequest(getNominaSchema), exportNominas);

/**
 * @openapi
 * /api/nomina/{num_cons}:
 *   get:
 *     summary: Obtener el recibo de nómina desglosado por consecutivo
 *     description: Retorna un recibo de nómina (maestro) detallado, incluyendo la separación completa de conceptos de percepciones y deducciones asociados.
 *     tags:
 *       - Nómina
 *     parameters:
 *       - in: path
 *         name: num_cons
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número consecutivo del recibo de nómina a consultar.
 *     responses:
 *       200:
 *         description: Detalle del recibo de nómina obtenido correctamente.
 *       400:
 *         description: num_cons inválido.
 *       404:
 *         description: Recibo de nómina no encontrado.
 *       500:
 *         description: Error interno del servidor o de base de datos.
 */
router.get('/:num_cons', validateRequest(getNominaByIdSchema), getNominaById);

export default router;

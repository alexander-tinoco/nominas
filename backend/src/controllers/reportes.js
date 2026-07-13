import * as reportesService from '../services/reportesService.js';

// GET /api/reportes/por-unidad
export const getReportePorUnidad = async (req, res, next) => {
  try {
    const result = await reportesService.getReportePorUnidad(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/reportes/conceptos
export const getReporteConceptos = async (req, res, next) => {
  try {
    const result = await reportesService.getReporteConceptos(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

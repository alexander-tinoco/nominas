import * as empleadosService from '../services/empleadosService.js';

// GET /api/empleados
export const getEmpleados = async (req, res, next) => {
  try {
    const result = await empleadosService.getEmpleados(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/empleados/:rfc
export const getEmpleadoByRfc = async (req, res, next) => {
  try {
    const { rfc } = req.params;
    const result = await empleadosService.getEmpleadoByRfc(rfc);

    if (!result) {
      return res.status(404).json({ error: `Empleado con RFC ${rfc} no encontrado` });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

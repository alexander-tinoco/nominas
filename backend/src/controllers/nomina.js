import * as nominaService from '../services/nominaService.js';

// GET /api/nomina
export const getNominas = async (req, res, next) => {
  try {
    const result = await nominaService.getNominas(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/nomina/:num_cons
export const getNominaById = async (req, res, next) => {
  try {
    const { num_cons } = req.params;
    const result = await nominaService.getNominaById(num_cons);

    if (!result) {
      return res.status(404).json({ error: `Registro de nómina con num_cons ${num_cons} no encontrado` });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

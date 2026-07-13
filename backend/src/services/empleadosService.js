import * as empleadosRepository from '../repositories/empleadosRepository.js';

export const getEmpleados = async (query = {}) => {
  let { search, page = 1, limit = 20 } = query;

  // Normalizar paginación
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;

  // Formatear búsqueda para ILIKE
  const searchPattern = search ? `%${search.trim()}%` : null;

  const { total, rows } = await empleadosRepository.findAndCount({
    searchPattern,
    limit,
    offset
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

export const getEmpleadoByRfc = async (rfc) => {
  const rows = await empleadosRepository.findByRfc(rfc);
  if (rows.length === 0) {
    return null;
  }

  return {
    rfc,
    nombre: rows[0].nom_emp,
    historial: rows
  };
};

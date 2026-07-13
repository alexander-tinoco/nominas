import * as reportesRepository from '../repositories/reportesRepository.js';
import { getCache, setCache } from '../config/redis.js';

export const getReportePorUnidad = async ({ qna, subunidad }) => {
  if (!qna) {
    const error = new Error("El parámetro de quincena '?qna=' es requerido (ej. ?qna=201806)");
    error.status = 400;
    throw error;
  }

  const qnaInt = parseInt(qna, 10);
  if (isNaN(qnaInt)) {
    const error = new Error("El parámetro 'qna' debe ser un número entero válido (formato AAAAQQ)");
    error.status = 400;
    throw error;
  }

  const includeSubunidad = subunidad === 'true';

  // Intentar recuperar de la caché
  const cacheKey = `reportes:unidad:${qnaInt}:${includeSubunidad}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const rows = await reportesRepository.findReportePorUnidad(qnaInt, includeSubunidad);

  const result = {
    qna: qnaInt,
    groupedBySubunidad: includeSubunidad,
    data: rows
  };

  // Guardar en caché con TTL de 10 minutos (600 segundos)
  await setCache(cacheKey, result, 600);

  return result;
};

export const getReporteConceptos = async ({ qna_start, qna_end }) => {
  const pQnaStart = qna_start ? parseInt(qna_start, 10) : null;
  const pQnaEnd = qna_end ? parseInt(qna_end, 10) : null;

  if (qna_start && isNaN(pQnaStart)) {
    const error = new Error("El parámetro qna_start debe ser un entero válido");
    error.status = 400;
    throw error;
  }
  if (qna_end && isNaN(pQnaEnd)) {
    const error = new Error("El parámetro qna_end debe ser un entero válido");
    error.status = 400;
    throw error;
  }

  // Intentar recuperar de la caché
  const cacheKey = `reportes:conceptos:${pQnaStart}:${pQnaEnd}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const rows = await reportesRepository.findReporteConceptos(pQnaStart, pQnaEnd);

  const result = {
    filters: {
      qna_start: pQnaStart,
      qna_end: pQnaEnd
    },
    data: rows
  };

  // Guardar en caché con TTL de 10 minutos (600 segundos)
  await setCache(cacheKey, result, 600);

  return result;
};

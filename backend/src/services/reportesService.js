import * as reportesRepository from '../repositories/reportesRepository.js';
import { getCache, setCache } from '../config/redis.js';

export const getReportePorUnidad = async ({ qna, subunidad }) => {
  const qnaInt = qna;
  const includeSubunidad = subunidad;

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
  const pQnaStart = qna_start;
  const pQnaEnd = qna_end;

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

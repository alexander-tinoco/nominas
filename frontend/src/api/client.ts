import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ==========================================
// Interfaces de TypeScript para Datos
// ==========================================

export interface NominaRegistro {
  num_cons: number;
  rfc: string;
  nom_emp: string;
  ent_fed: number;
  ct_clasif: string;
  ct_id: string;
  ct_secuencial: number;
  ct_digito_ver: string;
  cod_pago: number;
  unidad: number;
  subunidad: number;
  cat_puesto: string;
  horas: number;
  cons_plaza: number;
  nivel_sueldo: number;
  mot_mov: number;
  qna_ini: number;
  qna_fin: number;
  qna_pago: number;
  tot_perc_cheque: number;
  tot_ded_cheque: number;
  tot_net_cheque: number;
}

export interface ConceptoDetalle {
  concepto: string;
  importe: number;
  qna_ini: number;
  qna_fin: number;
}

export interface NominaDetalleResponse extends NominaRegistro {
  percepciones: ConceptoDetalle[];
  deducciones: ConceptoDetalle[];
}

export interface EmpleadoSimple {
  rfc: string;
  nom_emp: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmpleadosResponse {
  data: EmpleadoSimple[];
  pagination: Pagination;
}

export interface EmpleadoDetalleResponse {
  rfc: string;
  nombre: string;
  historial: NominaRegistro[];
}

export interface NominaListResponse {
  data: NominaRegistro[];
  pagination: Pagination;
}

export interface ReportePorUnidadItem {
  etiqueta: string;
  unidad: number;
  subunidad?: number;
  total_percepciones: number;
  total_deducciones: number;
  total_neto: number;
}

export interface ReportePorUnidadResponse {
  qna: number;
  groupedBySubunidad: boolean;
  data: ReportePorUnidadItem[];
}

export interface ReporteConceptoItem {
  etiqueta: string;
  concepto: string;
  perc_ded: 'P' | 'D';
  total_importe: number;
}

export interface ReporteConceptosResponse {
  filters: {
    qna_start: number | null;
    qna_end: number | null;
  };
  data: ReporteConceptoItem[];
}

// ==========================================
// Peticiones Fetch Básicas
// ==========================================

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ==========================================
// Clientes API REST
// ==========================================

export const api = {
  getEmpleados: (search = '', page = 1, limit = 20) => {
    const url = new URL(`${API_BASE_URL}/api/empleados`);
    if (search) url.searchParams.append('search', search);
    url.searchParams.append('page', String(page));
    url.searchParams.append('limit', String(limit));
    return fetchJson<EmpleadosResponse>(url.toString());
  },

  getEmpleadoDetalle: (rfc: string) => {
    return fetchJson<EmpleadoDetalleResponse>(`${API_BASE_URL}/api/empleados/${rfc}`);
  },

  getNomina: (filters: {
    unidad?: number;
    subunidad?: number;
    cat_puesto?: string;
    qna_ini?: number;
    qna_fin?: number;
    page?: number;
    limit?: number;
  }) => {
    const url = new URL(`${API_BASE_URL}/api/nomina`);
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, String(val));
      }
    });
    return fetchJson<NominaListResponse>(url.toString());
  },

  getNominaDetalle: (numCons: number) => {
    return fetchJson<NominaDetalleResponse>(`${API_BASE_URL}/api/nomina/${numCons}`);
  },

  getReportePorUnidad: (qna: number, subunidad = false) => {
    const url = new URL(`${API_BASE_URL}/api/reportes/por-unidad`);
    url.searchParams.append('qna', String(qna));
    if (subunidad) url.searchParams.append('subunidad', 'true');
    return fetchJson<ReportePorUnidadResponse>(url.toString());
  },

  getReporteConceptos: (qnaStart?: number, qnaEnd?: number) => {
    const url = new URL(`${API_BASE_URL}/api/reportes/conceptos`);
    if (qnaStart) url.searchParams.append('qna_start', String(qnaStart));
    if (qnaEnd) url.searchParams.append('qna_end', String(qnaEnd));
    return fetchJson<ReporteConceptosResponse>(url.toString());
  }
};

// ==========================================
// Hooks de React Query (Caché y Estados)
// ==========================================

export const useEmpleados = (search = '', page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['empleados', search, page, limit],
    queryFn: () => api.getEmpleados(search, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos de caché
    placeholderData: (prev) => prev // Mantener datos previos al paginar/buscar
  });
};

export const useEmpleadoDetalle = (rfc: string) => {
  return useQuery({
    queryKey: ['empleado-detalle', rfc],
    queryFn: () => api.getEmpleadoDetalle(rfc),
    enabled: !!rfc,
    staleTime: 5 * 60 * 1000
  });
};

export const useNominaList = (filters: Parameters<typeof api.getNomina>[0]) => {
  return useQuery({
    queryKey: ['nomina-list', filters],
    queryFn: () => api.getNomina(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev
  });
};

export const useNominaDetalle = (numCons: number | null) => {
  return useQuery({
    queryKey: ['nomina-detalle', numCons],
    queryFn: () => api.getNominaDetalle(numCons!),
    enabled: numCons !== null,
    staleTime: 5 * 60 * 1000
  });
};

export const useReportePorUnidad = (qna: number, subunidad = false) => {
  return useQuery({
    queryKey: ['reporte-unidad', qna, subunidad],
    queryFn: () => api.getReportePorUnidad(qna, subunidad),
    enabled: !!qna,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

export const useReporteConceptos = (qnaStart?: number, qnaEnd?: number) => {
  return useQuery({
    queryKey: ['reporte-conceptos', qnaStart, qnaEnd],
    queryFn: () => api.getReporteConceptos(qnaStart, qnaEnd),
    staleTime: 10 * 60 * 1000
  });
};

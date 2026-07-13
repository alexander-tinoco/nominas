import React, { Suspense, lazy } from 'react';
import { useReportePorUnidad, useReporteConceptos } from '../api/client';
import { useStore } from '../store/useStore';
import { FileBarChart2, Landmark } from 'lucide-react';

// Cargar la gráfica de forma diferida (React.lazy) para mejorar el bundle
const GraficaBalances = lazy(() =>
  import('./nomina/GraficaBalances').then(module => ({ default: module.GraficaBalances }))
);

// Skeleton loader para la carga asíncrona de las gráficas
const GraficaSkeleton = () => (
  <div className="flex flex-col gap-6 animate-pulse" role="progressbar" aria-label="Cargando gráficos contables">
    <div className="bg-zinc-100 dark:bg-zinc-800 h-64 w-full rounded-sm border border-accounting-indigo/10"></div>
    <div className="bg-zinc-100 dark:bg-zinc-800 h-64 w-full rounded-sm border border-accounting-indigo/10"></div>
  </div>
);

export const LeftBookPage: React.FC = () => {
  const { selectedQna } = useStore();

  // Queries
  const { 
    data: dataUnidad, 
    isLoading: loadingUnidad, 
    isError: errorUnidad 
  } = useReportePorUnidad(selectedQna);

  const { 
    data: dataConceptos, 
    isLoading: loadingConceptos, 
    isError: errorConceptos 
  } = useReporteConceptos(selectedQna, selectedQna);

  if (loadingUnidad || loadingConceptos) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-96 gap-3 text-accounting-graphite dark:text-zinc-400"
        role="status"
        aria-live="polite"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accounting-indigo dark:border-zinc-400"></div>
        <p className="font-mono text-sm">Consultando registros contables...</p>
      </div>
    );
  }

  if (errorUnidad || errorConceptos) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-96 p-6 text-center border-2 border-dashed border-accounting-red/30 rounded-sm bg-white dark:bg-zinc-900"
        role="alert"
      >
        <span className="text-accounting-red text-xl font-bold font-serif mb-2">Error de Lectura</span>
        <p className="text-sm text-accounting-graphite dark:text-zinc-300 font-sans">
          No se pudo establecer conexión con el libro de cuentas en el servidor.
        </p>
      </div>
    );
  }

  const hasData = (dataUnidad?.data.length ?? 0) > 0;
  const topConceptos = dataConceptos?.data.slice(0, 7) ?? [];

  return (
    <div className="flex flex-col gap-8 pr-2" role="main">
      {/* Encabezado de la página izquierda */}
      <div className="flex items-center gap-2 border-b border-accounting-indigo/20 pb-2">
        <Landmark className="w-5 h-5 text-accounting-indigo dark:text-zinc-200" aria-hidden="true" />
        <h3 className="font-serif text-xl font-bold text-accounting-indigo dark:text-zinc-100">Resumen y Balances</h3>
      </div>

      {!hasData ? (
        <div 
          className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-accounting-indigo/20 bg-white/40 dark:bg-zinc-900/40 p-8 rounded-sm"
          role="region"
          aria-label="No hay datos contables disponibles"
        >
          <FileBarChart2 className="w-12 h-12 text-accounting-indigo/30 mb-2" aria-hidden="true" />
          <span className="font-serif text-lg font-bold text-accounting-indigo dark:text-zinc-200 mb-1">Sin Asientos Contables</span>
          <p className="text-xs text-accounting-graphite dark:text-zinc-300 max-w-sm">
            No existen registros de pago ni deducción cargados en los libros para la quincena {selectedQna}.
          </p>
        </div>
      ) : (
        <Suspense fallback={<GraficaSkeleton />}>
          <GraficaBalances 
            dataUnidad={dataUnidad?.data ?? []} 
            topConceptos={topConceptos} 
          />
        </Suspense>
      )}
    </div>
  );
};

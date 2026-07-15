import React, { useState } from 'react';
import { useNominaList } from '../../api/client';
import { useAdvancedNominaFilters } from '../../hooks/useAdvancedNominaFilters';
import { formatCurrency } from '../../utils/formatters';
import { Inbox } from 'lucide-react';
import { FiltrosForm } from './BusquedaAvanzada/FiltrosForm';
import { GraficaBalanceFiltrado } from './BusquedaAvanzada/GraficaBalanceFiltrado';
import { TablaResultados } from './BusquedaAvanzada/TablaResultados';
import { Paginador } from './BusquedaAvanzada/Paginador';

interface BusquedaAvanzadaProps {
  onRowClick: (rfc: string, qna?: number) => void;
}

export const BusquedaAvanzada: React.FC<BusquedaAvanzadaProps> = ({ onRowClick }) => {
  const {
    advancedFilters,
    appliedFilters,
    pageAdvanced,
    setPageAdvanced,
    limitAdvanced,
    handleFilterChange,
    handleClearFilters,
    handleAdvancedSearchSubmit
  } = useAdvancedNominaFilters();

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      Object.entries(appliedFilters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/api/nomina/export?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al descargar el reporte');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `nomina_filtrada_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al intentar exportar los registros contables a CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Consulta de Nóminas
  const {
    data: dataAdvanced,
    isLoading: isLoadingAdvanced,
    isError: isErrorAdvanced,
  } = useNominaList({
    ...appliedFilters,
    page: pageAdvanced,
    limit: limitAdvanced
  });

  return (
    <div className="flex flex-col gap-6 flex-1 justify-between">
      {/* Formulario de Filtros */}
      <FiltrosForm 
        advancedFilters={advancedFilters}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
        handleAdvancedSearchSubmit={handleAdvancedSearchSubmit}
        handleExportCsv={handleExportCsv}
        isExporting={isExporting}
      />

      {/* Tabla de Resultados Avanzados */}
      <div className="flex-1 flex flex-col justify-between min-h-[340px]">
        {isLoadingAdvanced ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-accounting-graphite">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accounting-indigo"></div>
            <p className="font-mono text-xs">Consultando libros contables filtrados...</p>
          </div>
        ) : isErrorAdvanced ? (
          <div className="text-center py-20 text-accounting-red font-serif text-sm bg-white/50 border border-accounting-indigo/10 rounded-sm">
            Error al consultar nóminas filtradas. Revise los parámetros.
          </div>
        ) : (!dataAdvanced?.data || dataAdvanced.data.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-accounting-indigo/10 bg-white/20 rounded-sm">
            <Inbox className="w-10 h-10 text-accounting-indigo/20 mb-2" />
            <span className="font-serif text-sm font-bold text-accounting-indigo mb-1">Sin Registros Contables</span>
            <p className="text-xs text-accounting-graphite max-w-xs px-4">
              Ningún recibo coincide con los filtros aplicados en el balance de este período.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between">
            <div>
              {/* Panel de Métricas Dinámicas Contables */}
              {dataAdvanced.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-accounting-paper/30 border border-accounting-indigo/15 p-2 rounded-sm font-mono text-[10px]">
                  <div className="bg-white/60 p-2 rounded-sm border border-accounting-indigo/5">
                    <span className="block text-[8px] text-accounting-graphite uppercase font-bold">Plazas Filtradas</span>
                    <span className="font-bold text-accounting-indigo text-xs">
                      {dataAdvanced.summary.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/60 p-2 rounded-sm border border-accounting-indigo/5">
                    <span className="block text-[8px] text-accounting-graphite uppercase font-bold">Total Percepciones</span>
                    <span className="font-bold text-accounting-gold text-xs">
                      {formatCurrency(dataAdvanced.summary.totalPercepciones)}
                    </span>
                  </div>
                  <div className="bg-white/60 p-2 rounded-sm border border-accounting-indigo/5">
                    <span className="block text-[8px] text-accounting-graphite uppercase font-bold">Total Deducciones</span>
                    <span className="font-bold text-accounting-red text-xs">
                      -{formatCurrency(dataAdvanced.summary.totalDeducciones)}
                    </span>
                  </div>
                  <div className="bg-white/60 dark:bg-zinc-800/60 p-2 rounded-sm border border-accounting-indigo/5 dark:border-zinc-800">
                    <span className="block text-[8px] text-accounting-graphite dark:text-zinc-400 uppercase font-bold">Gasto Neto Liquidado</span>
                    <span className="font-bold text-accounting-green dark:text-emerald-500 text-xs">
                      {formatCurrency(dataAdvanced.summary.totalNeto)}
                    </span>
                  </div>
                </div>
              )}

              {/* Gráfica del Balance de Resultados Filtrados */}
              {dataAdvanced.summary && dataAdvanced.summary.total > 0 && (
                <GraficaBalanceFiltrado summary={dataAdvanced.summary} />
              )}
              
              {/* Tabla de Resultados */}
              <TablaResultados data={dataAdvanced.data} onRowClick={onRowClick} />
            </div>

            {/* Paginador Avanzado */}
            {dataAdvanced?.pagination && dataAdvanced.pagination.totalPages > 1 && (
              <Paginador 
                page={pageAdvanced}
                totalPages={dataAdvanced.pagination.totalPages}
                onPageChange={setPageAdvanced}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

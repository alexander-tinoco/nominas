import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { useReportePorUnidad, useReporteConceptos } from '../api/client';
import { useStore } from '../store/useStore';
import { FileBarChart2, Landmark } from 'lucide-react';

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

  // Formatear moneda (ej. 1234567.89 -> $1,234,567.89)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Formatear abreviado (ej. 1000000 -> $1.0M)
  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: 'MXN',
    }).format(val);
  };

  if (loadingUnidad || loadingConceptos) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-accounting-graphite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accounting-indigo"></div>
        <p className="font-mono text-sm">Consultando registros contables...</p>
      </div>
    );
  }

  if (errorUnidad || errorConceptos) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-6 text-center border-2 border-dashed border-accounting-red/30 rounded-sm bg-white">
        <span className="text-accounting-red text-xl font-bold font-serif mb-2">Error de Lectura</span>
        <p className="text-sm text-accounting-graphite font-sans">
          No se pudo establecer conexión con el libro de cuentas en el servidor.
        </p>
      </div>
    );
  }

  const hasData = (dataUnidad?.data.length ?? 0) > 0;
  const topConceptos = dataConceptos?.data.slice(0, 7) ?? [];

  return (
    <div className="flex flex-col gap-8 pr-2">
      {/* Encabezado de la página izquierda */}
      <div className="flex items-center gap-2 border-b border-accounting-indigo/20 pb-2">
        <Landmark className="w-5 h-5 text-accounting-indigo" />
        <h3 className="font-serif text-xl font-bold text-accounting-indigo">Resumen y Balances</h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-accounting-indigo/20 bg-white/40 p-8 rounded-sm">
          <FileBarChart2 className="w-12 h-12 text-accounting-indigo/30 mb-2" />
          <span className="font-serif text-lg font-bold text-accounting-indigo mb-1">Sin Asientos Contables</span>
          <p className="text-xs text-accounting-graphite max-w-sm">
            No existen registros de pago ni deducción cargados en los libros para la quincena {selectedQna}.
          </p>
        </div>
      ) : (
        <>
          {/* Gráfica 1: Balance Percepciones vs Deducciones por Unidad */}
          <div className="bg-white border border-accounting-indigo/15 p-4 rounded-sm shadow-sm">
            <h4 className="font-serif text-sm font-bold text-accounting-indigo mb-4 flex items-center justify-between">
              <span>Distribución Financiera por Unidad</span>
              <span className="font-mono text-[10px] text-accounting-graphite font-normal uppercase">
                Percepciones vs Deducciones
              </span>
            </h4>
            
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataUnidad?.data}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid 
                    stroke="#1E2A44" 
                    strokeOpacity={0.08} 
                    vertical={false} 
                  />
                  <XAxis 
                    dataKey="etiqueta" 
                    tick={{ fill: '#1E2A44', fontFamily: 'IBM Plex Sans', fontSize: 10 }}
                    stroke="#1E2A44"
                    strokeOpacity={0.3}
                  />
                  <YAxis 
                    tickFormatter={formatCompact}
                    tick={{ fill: '#1E2A44', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                    stroke="#1E2A44"
                    strokeOpacity={0.3}
                  />
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(Number(val)), '']}
                    contentStyle={{ 
                      backgroundColor: '#E7ECDF', 
                      borderColor: '#1E2A44', 
                      fontFamily: 'IBM Plex Sans',
                      fontSize: '11px',
                      borderRadius: '2px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'IBM Plex Sans', paddingTop: '10px' }} 
                  />
                  <Bar 
                    dataKey="total_percepciones" 
                    name="Percepciones" 
                    stackId="a" 
                    fill="#C9971C" 
                  />
                  <Bar 
                    dataKey="total_deducciones" 
                    name="Deducciones" 
                    stackId="a" 
                    fill="#B5442E" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfica 2: Ranking de Conceptos de Mayor Monto */}
          <div className="bg-white border border-accounting-indigo/15 p-4 rounded-sm shadow-sm">
            <h4 className="font-serif text-sm font-bold text-accounting-indigo mb-4 flex items-center justify-between">
              <span>Conceptos con Mayor Flujo Monetario</span>
              <span className="font-mono text-[10px] text-accounting-graphite font-normal uppercase">
                Ranking de Importes
              </span>
            </h4>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topConceptos}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid 
                    stroke="#1E2A44" 
                    strokeOpacity={0.08} 
                    horizontal={false} 
                  />
                  <XAxis 
                    type="number"
                    tickFormatter={formatCompact}
                    tick={{ fill: '#1E2A44', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                    stroke="#1E2A44"
                    strokeOpacity={0.3}
                  />
                  <YAxis 
                    type="category"
                    dataKey="etiqueta" 
                    width={85}
                    tick={{ fill: '#1E2A44', fontFamily: 'IBM Plex Sans', fontSize: 9 }}
                    stroke="#1E2A44"
                    strokeOpacity={0.3}
                  />
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Importe Total']}
                    contentStyle={{ 
                      backgroundColor: '#E7ECDF', 
                      borderColor: '#1E2A44', 
                      fontFamily: 'IBM Plex Sans',
                      fontSize: '11px',
                      borderRadius: '2px'
                    }}
                  />
                  <Bar dataKey="total_importe" name="Total Importe">
                    {topConceptos.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.perc_ded === 'P' ? '#C9971C' : '#B5442E'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Acotación de colores */}
            <div className="flex gap-4 justify-end mt-2 text-[10px] font-sans text-accounting-graphite">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-accounting-gold rounded-sm inline-block"></span>
                <span>Percepciones (Oro)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-accounting-red rounded-sm inline-block"></span>
                <span>Deducciones (Rojo)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

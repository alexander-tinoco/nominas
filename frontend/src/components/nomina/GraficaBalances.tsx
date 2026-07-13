import React from 'react';
import { formatCurrency } from '../../utils/formatters';
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

interface GraficaBalancesProps {
  dataUnidad: any[];
  topConceptos: any[];
}

export const GraficaBalances: React.FC<GraficaBalancesProps> = ({ dataUnidad, topConceptos }) => {
  const formatCompact = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: 'MXN',
    }).format(val);
  };

  return (
    <>
      {/* Gráfica 1: Balance Percepciones vs Deducciones por Unidad */}
      <div 
        className="bg-white dark:bg-zinc-900 border border-accounting-indigo/15 dark:border-zinc-800 p-4 rounded-sm shadow-sm"
        role="region"
        aria-label="Gráfica de distribución financiera por unidad"
      >
        <h4 className="font-serif text-sm font-bold text-accounting-indigo dark:text-zinc-200 mb-4 flex items-center justify-between">
          <span>Distribución Financiera por Unidad</span>
          <span className="font-mono text-[10px] text-accounting-graphite dark:text-zinc-400 font-normal uppercase">
            Percepciones vs Deducciones
          </span>
        </h4>
        
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataUnidad}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid 
                stroke="#1E2A44" 
                strokeOpacity={0.08} 
                vertical={false} 
              />
              <XAxis 
                dataKey="etiqueta" 
                tick={{ fill: 'currentColor', fontFamily: 'IBM Plex Sans', fontSize: 10 }}
                stroke="currentColor"
                strokeOpacity={0.3}
                className="text-accounting-indigo dark:text-zinc-400"
              />
              <YAxis 
                tickFormatter={formatCompact}
                tick={{ fill: 'currentColor', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                stroke="currentColor"
                strokeOpacity={0.3}
                className="text-accounting-indigo dark:text-zinc-400"
              />
              <Tooltip 
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ 
                  backgroundColor: '#E7ECDF', 
                  borderColor: '#1E2A44', 
                  fontFamily: 'IBM Plex Sans',
                  fontSize: '11px',
                  borderRadius: '2px',
                  color: '#1E2A44'
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
      <div 
        className="bg-white dark:bg-zinc-900 border border-accounting-indigo/15 dark:border-zinc-800 p-4 rounded-sm shadow-sm"
        role="region"
        aria-label="Gráfica de conceptos con mayor flujo monetario"
      >
        <h4 className="font-serif text-sm font-bold text-accounting-indigo dark:text-zinc-200 mb-4 flex items-center justify-between">
          <span>Conceptos con Mayor Flujo Monetario</span>
          <span className="font-mono text-[10px] text-accounting-graphite dark:text-zinc-400 font-normal uppercase">
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
                tick={{ fill: 'currentColor', fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                stroke="currentColor"
                strokeOpacity={0.3}
                className="text-accounting-indigo dark:text-zinc-400"
              />
              <YAxis 
                type="category"
                dataKey="etiqueta" 
                width={85}
                tick={{ fill: 'currentColor', fontFamily: 'IBM Plex Sans', fontSize: 9 }}
                stroke="currentColor"
                strokeOpacity={0.3}
                className="text-accounting-indigo dark:text-zinc-400"
              />
              <Tooltip 
                formatter={(val: any) => [formatCurrency(Number(val)), 'Importe Total']}
                contentStyle={{ 
                  backgroundColor: '#E7ECDF', 
                  borderColor: '#1E2A44', 
                  fontFamily: 'IBM Plex Sans',
                  fontSize: '11px',
                  borderRadius: '2px',
                  color: '#1E2A44'
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
        <div className="flex gap-4 justify-end mt-2 text-[10px] font-sans text-accounting-graphite dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[#C9971C] rounded-sm inline-block" aria-hidden="true"></span>
            <span>Percepciones (Oro)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[#B5442E] rounded-sm inline-block" aria-hidden="true"></span>
            <span>Deducciones (Rojo)</span>
          </div>
        </div>
      </div>
    </>
  );
};

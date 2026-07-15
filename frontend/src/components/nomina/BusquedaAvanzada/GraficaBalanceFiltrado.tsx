import React from 'react';
import { 
  BarChart as RechartsBarChart, 
  Bar as RechartsBar, 
  XAxis as RechartsXAxis, 
  YAxis as RechartsYAxis, 
  Cell as RechartsCell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer as RechartsResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '../../../utils/formatters';

interface GraficaBalanceFiltradoProps {
  summary: {
    totalPercepciones: number;
    totalDeducciones: number;
    totalNeto: number;
  };
}

export const GraficaBalanceFiltrado: React.FC<GraficaBalanceFiltradoProps> = ({ summary }) => {
  return (
    <div 
      className="bg-white dark:bg-zinc-900 border border-accounting-indigo/15 dark:border-zinc-800 p-3 rounded-sm shadow-sm mb-4"
      role="region"
      aria-label="Gráfica de balance contable de los resultados filtrados"
    >
      <span className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite dark:text-zinc-450 font-bold mb-2">
        Balance Financiero Filtrado
      </span>
      <div className="h-28 w-full">
        <RechartsResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            layout="vertical"
            data={[
              { name: 'Percepciones', monto: summary.totalPercepciones },
              { name: 'Deducciones', monto: summary.totalDeducciones },
              { name: 'Neto Recibido', monto: summary.totalNeto }
            ]}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <RechartsXAxis 
              type="number"
              tickFormatter={(val) => new Intl.NumberFormat('es-MX', { notation: 'compact', compactDisplay: 'short' }).format(val)}
              tick={{ fill: 'currentColor', fontFamily: 'IBM Plex Mono', fontSize: 8 }}
              stroke="currentColor"
              strokeOpacity={0.2}
              className="text-accounting-indigo dark:text-zinc-400"
            />
            <RechartsYAxis 
              type="category"
              dataKey="name" 
              width={75}
              tick={{ fill: 'currentColor', fontFamily: 'IBM Plex Sans', fontSize: 9 }}
              stroke="currentColor"
              strokeOpacity={0.2}
              className="text-accounting-indigo dark:text-zinc-400"
            />
            <RechartsTooltip 
              formatter={(val: any) => [formatCurrency(Number(val)), '']}
              contentStyle={{ 
                backgroundColor: '#E7ECDF', 
                borderColor: '#1E2A44', 
                fontFamily: 'IBM Plex Sans',
                fontSize: '10px',
                borderRadius: '2px',
                color: '#1E2A44'
              }}
            />
            <RechartsBar dataKey="monto" barSize={12}>
              {[
                { fill: '#C9971C' },
                { fill: '#B5442E' },
                { fill: '#2F6F63' }
              ].map((entry, index) => (
                <RechartsCell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </RechartsBar>
          </RechartsBarChart>
        </RechartsResponsiveContainer>
      </div>
    </div>
  );
};

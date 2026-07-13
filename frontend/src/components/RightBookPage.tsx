import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { User, Filter } from 'lucide-react';
import { CatalogoSimple } from './nomina/CatalogoSimple';
import { BusquedaAvanzada } from './nomina/BusquedaAvanzada';

export const RightBookPage: React.FC = () => {
  const { setSelectedRfc, setSelectedQna } = useStore();
  
  // Pestaña activa: 'simple' (Catálogo) o 'advanced' (Consulta Avanzada de Nóminas)
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');

  // Click en una fila
  const handleRowClick = (rfc: string, qna?: number) => {
    if (qna) {
      setSelectedQna(qna);
    }
    setSelectedRfc(rfc);
  };

  return (
    <div className="flex flex-col gap-6 pl-2 flex-1" role="region" aria-label="Sección de búsqueda y listado contable">
      {/* Encabezado e Interruptor de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-accounting-indigo/20 dark:border-zinc-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accounting-indigo dark:text-zinc-200" aria-hidden="true" />
          <h3 className="font-serif text-xl font-bold text-accounting-indigo dark:text-zinc-100">Búsqueda de Cuentas</h3>
        </div>
        
        {/* Selector de Pestaña */}
        <div 
          className="flex bg-accounting-paper/50 dark:bg-zinc-800 p-0.5 rounded-sm border border-accounting-indigo/15 dark:border-zinc-700"
          role="tablist"
          aria-label="Pestañas de filtrado"
        >
          <button
            onClick={() => setActiveTab('simple')}
            role="tab"
            aria-selected={activeTab === 'simple'}
            aria-controls="tabpanel-personal"
            id="tab-personal"
            className={`
              px-3 py-1 text-xs font-mono font-bold uppercase transition-colors rounded-sm focus:ring-1 focus:ring-accounting-green focus:outline-none
              ${activeTab === 'simple' 
                ? 'bg-accounting-indigo dark:bg-zinc-700 text-accounting-paper dark:text-zinc-100 shadow-sm' 
                : 'text-accounting-graphite dark:text-zinc-400 hover:text-accounting-indigo dark:hover:text-zinc-200'}
            `}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            role="tab"
            aria-selected={activeTab === 'advanced'}
            aria-controls="tabpanel-filtros"
            id="tab-filtros"
            className={`
              px-3 py-1 text-xs font-mono font-bold uppercase transition-colors rounded-sm flex items-center gap-1 focus:ring-1 focus:ring-accounting-green focus:outline-none
              ${activeTab === 'advanced' 
                ? 'bg-accounting-indigo dark:bg-zinc-700 text-accounting-paper dark:text-zinc-100 shadow-sm' 
                : 'text-accounting-graphite dark:text-zinc-400 hover:text-accounting-indigo dark:hover:text-zinc-200'}
            `}
          >
            <Filter className="w-3 h-3" aria-hidden="true" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Renderizado de pestañas */}
      <div 
        role="tabpanel"
        id={activeTab === 'simple' ? 'tabpanel-personal' : 'tabpanel-filtros'}
        aria-labelledby={activeTab === 'simple' ? 'tab-personal' : 'tab-filtros'}
        className="flex-1 flex flex-col"
      >
        {activeTab === 'simple' ? (
          <CatalogoSimple onRowClick={handleRowClick} />
        ) : (
          <BusquedaAvanzada onRowClick={handleRowClick} />
        )}
      </div>
    </div>
  );
};

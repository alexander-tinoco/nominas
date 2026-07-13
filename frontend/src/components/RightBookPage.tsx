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
    <div className="flex flex-col gap-6 pl-2 flex-1">
      {/* Encabezado e Interruptor de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-accounting-indigo/20 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accounting-indigo" />
          <h3 className="font-serif text-xl font-bold text-accounting-indigo">Búsqueda de Cuentas</h3>
        </div>
        
        {/* Selector de Pestaña */}
        <div className="flex bg-accounting-paper/50 p-0.5 rounded-sm border border-accounting-indigo/15">
          <button
            onClick={() => setActiveTab('simple')}
            className={`
              px-3 py-1 text-xs font-mono font-bold uppercase transition-colors rounded-sm
              ${activeTab === 'simple' 
                ? 'bg-accounting-indigo text-accounting-paper shadow-sm' 
                : 'text-accounting-graphite hover:text-accounting-indigo'}
            `}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`
              px-3 py-1 text-xs font-mono font-bold uppercase transition-colors rounded-sm flex items-center gap-1
              ${activeTab === 'advanced' 
                ? 'bg-accounting-indigo text-accounting-paper shadow-sm' 
                : 'text-accounting-graphite hover:text-accounting-indigo'}
            `}
          >
            <Filter className="w-3 h-3" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Renderizado de pestañas */}
      {activeTab === 'simple' ? (
        <CatalogoSimple onRowClick={handleRowClick} />
      ) : (
        <BusquedaAvanzada onRowClick={handleRowClick} />
      )}
    </div>
  );
};

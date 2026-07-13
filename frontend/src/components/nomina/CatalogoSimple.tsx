import React, { useState, useEffect } from 'react';
import { useEmpleados } from '../../api/client';
import { Search, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogoSimpleProps {
  onRowClick: (rfc: string) => void;
}

export const CatalogoSimple: React.FC<CatalogoSimpleProps> = ({ onRowClick }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSimple, setPageSimple] = useState(1);
  const limitSimple = 10;

  // Resetear página simple al buscar
  useEffect(() => {
    setPageSimple(1);
  }, [searchQuery]);

  const { 
    data: dataSimple, 
    isLoading: isLoadingSimple, 
    isError: isErrorSimple 
  } = useEmpleados(searchQuery, pageSimple, limitSimple);

  const handleSimpleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  return (
    <div className="flex flex-col gap-6 flex-1 justify-between">
      <form onSubmit={handleSimpleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-accounting-graphite" />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por RFC o Nombre..."
            className="
              block w-full pl-9 pr-3 py-2 text-sm bg-white border border-accounting-indigo/20 rounded-sm
              focus:outline-none focus:ring-1 focus:ring-accounting-green focus:border-accounting-green
              placeholder-accounting-graphite/60 font-sans text-accounting-indigo
            "
          />
        </div>
        <button
          type="submit"
          className="
            px-4 py-2 bg-accounting-indigo text-accounting-paper font-sans text-sm rounded-sm font-medium
            hover:bg-accounting-indigo/90 focus:outline-none focus:ring-2 focus:ring-accounting-green transition-colors
          "
        >
          Buscar
        </button>
      </form>

      {/* Tabla de Catálogo */}
      <div className="flex-1 flex flex-col justify-between min-h-[380px]">
        {isLoadingSimple ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-accounting-graphite">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accounting-indigo"></div>
            <p className="font-mono text-xs">Buscando en nóminas...</p>
          </div>
        ) : isErrorSimple ? (
          <div className="text-center py-20 text-accounting-red font-serif text-sm bg-white/50 border border-accounting-indigo/10 rounded-sm">
            Error al consultar el personal. Inténtelo más tarde.
          </div>
        ) : (!dataSimple?.data || dataSimple.data.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-accounting-indigo/10 bg-white/20 rounded-sm">
            <Inbox className="w-10 h-10 text-accounting-indigo/20 mb-2" />
            <span className="font-serif text-sm font-bold text-accounting-indigo mb-1">Sin Resultados</span>
            <p className="text-xs text-accounting-graphite max-w-xs">
              No se encontraron empleados con ese criterio en los libros de la quincena.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left font-sans">
              <thead>
                <tr className="border-b border-accounting-indigo/30 text-[10px] uppercase tracking-wider text-accounting-graphite font-bold font-mono">
                  <th className="py-2 px-3">RFC</th>
                  <th className="py-2 px-3">Nombre Completo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accounting-indigo/10 text-sm">
                {dataSimple.data.map((emp) => (
                  <tr
                    key={emp.rfc}
                    onClick={() => onRowClick(emp.rfc)}
                    className="bg-white hover:bg-accounting-paper/50 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="py-2 px-3 font-mono text-xs text-accounting-indigo group-hover:text-accounting-green font-bold">
                      {emp.rfc}
                    </td>
                    <td className="py-2 px-3 text-accounting-indigo group-hover:text-accounting-green">
                      {emp.nom_emp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador Catálogo */}
        {dataSimple?.pagination && dataSimple.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-accounting-indigo/20 pt-4 mt-4 font-mono text-xs text-accounting-graphite font-bold">
            <button
              onClick={() => setPageSimple((p) => Math.max(1, p - 1))}
              disabled={pageSimple === 1}
              className="
                flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
                hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
              "
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            
            <span>
              Página {pageSimple} de {dataSimple.pagination.totalPages}
            </span>

            <button
              onClick={() => setPageSimple((p) => Math.min(dataSimple.pagination.totalPages, p + 1))}
              disabled={pageSimple === dataSimple.pagination.totalPages}
              className="
                flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
                hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
              "
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginadorProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number | ((prev: number) => number)) => void;
}

export const Paginador: React.FC<PaginadorProps> = ({ page, totalPages, onPageChange }) => {
  return (
    <div className="flex items-center justify-between border-t border-accounting-indigo/20 pt-4 mt-4 font-mono text-xs text-accounting-graphite font-bold">
      <button
        type="button"
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="
          flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
          hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
        "
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Anterior</span>
      </button>
      
      <span>
        Página {page} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="
          flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
          hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
        "
      >
        <span>Siguiente</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

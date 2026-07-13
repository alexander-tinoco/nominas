import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

interface QuincenaTimelineProps {
  quincenas?: number[];
}

export const QuincenaTimeline: React.FC<QuincenaTimelineProps> = ({
  quincenas = [201801, 201802, 201803, 201804, 201805, 201806]
}) => {
  const { selectedQna, setSelectedQna } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Formatear quincena (ej. 201806 -> "Qna 06 - 2018")
  const formatQna = (qna: number) => {
    const qnaStr = String(qna);
    if (qnaStr.length === 6) {
      const year = qnaStr.substring(0, 4);
      const qnaNum = qnaStr.substring(4, 6);
      return { year, qnaNum };
    }
    return { year: 'N/A', qnaNum: String(qna) };
  };

  // Soporte para navegación con flechas de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = quincenas.indexOf(selectedQna);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowRight') {
        const nextIndex = Math.min(quincenas.length - 1, currentIndex + 1);
        setSelectedQna(quincenas[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = Math.max(0, currentIndex - 1);
        setSelectedQna(quincenas[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedQna, quincenas, setSelectedQna]);

  return (
    <div 
      className="w-full bg-[#E2E7DB] dark:bg-zinc-900 border-b-2 border-accounting-indigo/30 dark:border-zinc-800 py-4 px-6 select-none transition-colors duration-200"
      role="region"
      aria-label="Línea de tiempo de quincenas de nómina"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-accounting-graphite dark:text-zinc-400 font-mono font-bold">Libro de Quincenas</span>
          <h2 className="font-serif text-2xl font-extrabold text-accounting-indigo dark:text-zinc-100">Registro General de Nómina</h2>
        </div>
        
        {/* Strip horizontal scrollable de quincenas */}
        <div 
          ref={containerRef}
          role="tablist"
          aria-label="Selección de periodo de nómina"
          className="flex items-center gap-6 overflow-x-auto py-2 scroll-smooth no-scrollbar"
        >
          {quincenas.map((qna) => {
            const isSelected = qna === selectedQna;
            const { year, qnaNum } = formatQna(qna);

            return (
              <button
                key={qna}
                onClick={() => setSelectedQna(qna)}
                role="tab"
                aria-selected={isSelected}
                aria-label={`Seleccionar quincena ${qnaNum} del año ${year}`}
                className={`
                  relative flex flex-col items-center justify-center min-w-[100px] h-[72px] px-3
                  border border-accounting-indigo/40 dark:border-zinc-700 rounded-sm
                  perforated-left perforated-right transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accounting-green
                  ${isSelected 
                    ? 'bg-accounting-green dark:bg-emerald-700 text-accounting-paper dark:text-zinc-100 border-accounting-green dark:border-emerald-700 shadow-inner scale-105' 
                    : 'bg-white dark:bg-zinc-800 text-accounting-indigo dark:text-zinc-200 hover:bg-white/80 dark:hover:bg-zinc-750 hover:scale-102'
                  }
                `}
              >
                <span className="text-[10px] uppercase font-mono tracking-wider opacity-85">
                  Quincena
                </span>
                <span className="text-xl font-bold font-mono tracking-tighter">
                  {qnaNum}
                </span>
                <span className="text-[10px] font-mono mt-1 opacity-70">
                  {year}
                </span>
                {isSelected && (
                  <div className="absolute -bottom-1 w-2 h-2 bg-accounting-green dark:bg-emerald-700 rotate-45 border-r border-b border-accounting-green dark:border-emerald-700"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

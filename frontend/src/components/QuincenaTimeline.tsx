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
    <div className="w-full bg-[#E2E7DB] border-b-2 border-accounting-indigo/30 py-4 px-6 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-accounting-graphite font-mono font-bold">Libro de Quincenas</span>
          <h2 className="font-serif text-2xl font-extrabold text-accounting-indigo">Registro General de Nómina</h2>
        </div>
        
        {/* Strip horizontal scrollable de quincenas */}
        <div 
          ref={containerRef}
          className="flex items-center gap-6 overflow-x-auto py-2 scroll-smooth no-scrollbar"
        >
          {quincenas.map((qna) => {
            const isSelected = qna === selectedQna;
            const { year, qnaNum } = formatQna(qna);

            return (
              <button
                key={qna}
                onClick={() => setSelectedQna(qna)}
                aria-label={`Seleccionar quincena ${qnaNum} del año ${year}`}
                className={`
                  relative flex flex-col items-center justify-center min-w-[100px] h-[72px] px-3
                  border border-accounting-indigo/40 rounded-sm
                  perforated-left perforated-right transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accounting-green
                  ${isSelected 
                    ? 'bg-accounting-green text-accounting-paper border-accounting-green shadow-inner scale-105' 
                    : 'bg-white text-accounting-indigo hover:bg-white/80 hover:scale-102'
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
                  <div className="absolute -bottom-1 w-2 h-2 bg-accounting-green rotate-45 border-r border-b border-accounting-green"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

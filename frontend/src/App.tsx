import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from './store/useStore';
import { QuincenaTimeline } from './components/QuincenaTimeline';
import { LeftBookPage } from './components/LeftBookPage';
import { RightBookPage } from './components/RightBookPage';
import { PayStubDetail } from './components/PayStubDetail';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackEvent } from './utils/analytics';
import { BookOpen } from 'lucide-react';

// Instanciar el Query Client para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Desactivar refetch automático al cambiar de ventana
      retry: 1, // Reintentar fallos una sola vez
    },
  },
});

function MainDashboard() {
  const { selectedQna, selectedRfc } = useStore();

  // 1. Monitoreo: Trackear cambios de quincena seleccionada
  useEffect(() => {
    trackEvent('selected_quincena', { qna: selectedQna });
  }, [selectedQna]);

  // 2. Monitoreo: Trackear cuando se ve el detalle de un empleado
  useEffect(() => {
    if (selectedRfc) {
      trackEvent('view_employee_detail', { rfc: selectedRfc });
    }
  }, [selectedRfc]);

  return (
    <div className="min-h-screen bg-accounting-paper flex flex-col font-sans">
      {/* 1. Elemento Firma: Línea de tiempo de quincenas (lomo del libro) */}
      <QuincenaTimeline />

      {/* 2. Layout "Libro Abierto" */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col justify-start">
        <div className="bg-white/80 backdrop-blur-sm border border-accounting-indigo/15 rounded-sm shadow-lg p-6 lg:p-10 flex flex-col flex-1">
          
          {/* Sello de Libro Mayor */}
          <div className="flex items-center gap-2 mb-6 border-b border-accounting-indigo/10 pb-4 text-accounting-graphite">
            <BookOpen className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest font-bold">
              Libro Mayor de Nómina • Ejercicio Fiscal 2018
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-8 items-stretch flex-1">
            
            {/* Página Izquierda (Gráficas agregadas) */}
            <section className="flex flex-col">
              <LeftBookPage />
            </section>

            {/* Costura del libro abierto (Separador estético central) */}
            <div className="hidden lg:flex flex-col items-center self-stretch mx-2 relative select-none" aria-hidden="true">
              {/* Línea de costura */}
              <div className="w-px bg-accounting-indigo/15 h-full border-l border-dashed border-accounting-indigo/30"></div>
              {/* Anillo de encuadernación decorativo en el centro */}
              <div className="absolute top-1/3 -translate-y-1/2 w-4 h-4 bg-accounting-paper border-2 border-accounting-indigo/25 rounded-full"></div>
              <div className="absolute top-2/3 -translate-y-1/2 w-4 h-4 bg-accounting-paper border-2 border-accounting-indigo/25 rounded-full"></div>
            </div>

            {/* Página Derecha (Buscador / Detalle de empleado) */}
            <section className="flex flex-col mt-8 lg:mt-0">
              {selectedRfc ? (
                <PayStubDetail />
              ) : (
                <RightBookPage />
              )}
            </section>
            
          </div>
        </div>
      </main>

      {/* Pie de libro contable */}
      <footer className="text-center py-4 border-t border-accounting-indigo/10 text-[10px] font-mono text-accounting-graphite bg-[#E1E6D8]">
        AUDITORÍA GENERAL DE NÓMINA E INTEGRIDAD CONTABLE • ESTADO CENTRALIZADO
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MainDashboard />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

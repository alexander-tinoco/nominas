import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { QuincenaTimeline } from './components/QuincenaTimeline';
import { LeftBookPage } from './components/LeftBookPage';
import { RightBookPage } from './components/RightBookPage';
import { PayStubDetail } from './components/PayStubDetail';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/LoginPage';
import { SecurityLogsPanel } from './components/SecurityLogsPanel';
import { trackEvent } from './utils/analytics';
import { BookOpen, Sun, Moon, LogOut, ShieldAlert } from 'lucide-react';

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
  const { user, logout } = useAuthStore();
  const [showLogs, setShowLogs] = useState(false);

  // Detectar y guardar estado del tema (Modo Oscuro / Claro)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    
    // Detectar prefers-color-scheme del sistema (Fail-safe)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemDark ? 'dark' : 'light';
    }
    return 'light';
  });

  // Aplicar cambios en la clase raíz html
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
    <div className="min-h-screen bg-accounting-paper dark:bg-zinc-950 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Elemento Firma: Línea de tiempo de quincenas (lomo del libro) */}
      <QuincenaTimeline />

      {/* 2. Layout "Libro Abierto" */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col justify-start" role="main">
        <div className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm border border-accounting-indigo/15 dark:border-zinc-800 rounded-sm shadow-lg p-6 lg:p-10 flex flex-col flex-1">
          
          {/* Sello de Libro Mayor */}
          <div className="flex items-center justify-between mb-6 border-b border-accounting-indigo/10 dark:border-zinc-800 pb-4 text-accounting-graphite dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accounting-indigo dark:text-zinc-300" aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-accounting-indigo dark:text-zinc-200">
                Libro Mayor de Nómina • Ejercicio Fiscal 2018
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Identidad de sesión */}
              {user && (
                <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accounting-graphite dark:text-zinc-400 border border-accounting-indigo/10 dark:border-zinc-800 rounded-sm px-2 py-1">
                  {user.email}
                  <span className="font-bold text-accounting-indigo dark:text-zinc-200">· {user.rol}</span>
                </span>
              )}

              {/* Bitácora de seguridad (solo admin) */}
              {user?.rol === 'admin' && (
                <button
                  onClick={() => setShowLogs(true)}
                  className="p-1.5 rounded-sm hover:bg-accounting-indigo/10 dark:hover:bg-zinc-800 transition-colors focus:ring-1 focus:ring-accounting-green focus:outline-none"
                  aria-label="Ver bitácora de seguridad"
                  type="button"
                >
                  <ShieldAlert className="w-4 h-4 text-accounting-indigo dark:text-zinc-200" />
                </button>
              )}

              {/* Cerrar sesión */}
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-sm hover:bg-accounting-indigo/10 dark:hover:bg-zinc-800 transition-colors focus:ring-1 focus:ring-accounting-green focus:outline-none"
                aria-label="Cerrar sesión"
                type="button"
              >
                <LogOut className="w-4 h-4 text-accounting-indigo dark:text-zinc-200" />
              </button>

              {/* Toggle de Modo Oscuro */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-sm hover:bg-accounting-indigo/10 dark:hover:bg-zinc-800 transition-colors focus:ring-1 focus:ring-accounting-green focus:outline-none"
                aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                type="button"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-accounting-indigo" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            </div>
          </div>

          {showLogs && <SecurityLogsPanel onClose={() => setShowLogs(false)} />}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-8 items-stretch flex-1">
            
            {/* Página Izquierda (Gráficas agregadas) */}
            <section className="flex flex-col" aria-label="Resumen financiero y métricas">
              <LeftBookPage />
            </section>

            {/* Costura del libro abierto (Separador estético central) */}
            <div className="hidden lg:flex flex-col items-center self-stretch mx-2 relative select-none" aria-hidden="true">
              {/* Línea de costura */}
              <div className="w-px bg-accounting-indigo/15 dark:bg-zinc-800 h-full border-l border-dashed border-accounting-indigo/30 dark:border-zinc-700"></div>
              {/* Anillo de encuadernación decorativo en el centro */}
              <div className="absolute top-1/3 -translate-y-1/2 w-4 h-4 bg-accounting-paper dark:bg-zinc-900 border-2 border-accounting-indigo/25 dark:border-zinc-700 rounded-full"></div>
              <div className="absolute top-2/3 -translate-y-1/2 w-4 h-4 bg-accounting-paper dark:bg-zinc-900 border-2 border-accounting-indigo/25 dark:border-zinc-700 rounded-full"></div>
            </div>

            {/* Página Derecha (Buscador / Detalle de empleado) */}
            <section className="flex flex-col mt-8 lg:mt-0" aria-label="Búsqueda avanzada y detalle de plaza">
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
      <footer className="text-center py-4 border-t border-accounting-indigo/10 dark:border-zinc-800 text-[10px] font-mono text-accounting-graphite dark:text-zinc-400 bg-[#E1E6D8] dark:bg-zinc-900 transition-colors duration-200">
        AUDITORÍA GENERAL DE NÓMINA E INTEGRIDAD CONTABLE • ESTADO CENTRALIZADO
      </footer>
    </div>
  );
}

function AuthGate() {
  const { status, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen bg-accounting-paper dark:bg-zinc-950 flex items-center justify-center transition-colors duration-200">
        <p className="font-mono text-xs uppercase tracking-widest text-accounting-graphite dark:text-zinc-400">
          Verificando sesión...
        </p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  return <MainDashboard />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

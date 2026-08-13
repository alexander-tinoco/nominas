import { useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage = () => {
  const { login, status, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isLoading = status === 'loading';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(email, password);
    } catch (err) {
      setLocalError((err as Error).message || 'No se pudo iniciar sesión');
    }
  };

  const mensajeError = localError || error;
  const esBloqueo = mensajeError?.toLowerCase().includes('bloqueada');

  return (
    <div className="min-h-screen bg-accounting-paper dark:bg-zinc-950 flex items-center justify-center p-6 transition-colors duration-200">
      <div className="max-w-sm w-full bg-white/80 dark:bg-zinc-900/90 backdrop-blur-sm border border-accounting-indigo/15 dark:border-zinc-800 rounded-sm shadow-lg p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <BookOpen className="w-8 h-8 text-accounting-indigo dark:text-zinc-300 mb-2" aria-hidden="true" />
          <h1 className="font-serif text-xl font-bold text-accounting-indigo dark:text-zinc-100">
            Libro Mayor de Nómina
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accounting-graphite dark:text-zinc-400 mt-1">
            Acceso restringido — inicie sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label="Formulario de inicio de sesión">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="font-mono text-xs font-bold text-accounting-indigo dark:text-zinc-300">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-accounting-indigo/20 dark:border-zinc-700 rounded-sm text-accounting-indigo dark:text-zinc-100 focus:ring-1 focus:ring-accounting-green focus:outline-none"
              placeholder="usuario@nominas.local"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="font-mono text-xs font-bold text-accounting-indigo dark:text-zinc-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-accounting-indigo/20 dark:border-zinc-700 rounded-sm text-accounting-indigo dark:text-zinc-100 focus:ring-1 focus:ring-accounting-green focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {mensajeError && (
            <p
              role="alert"
              className={`text-xs font-mono px-3 py-2 rounded-sm border ${
                esBloqueo
                  ? 'text-accounting-red border-accounting-red/30 bg-accounting-red/10'
                  : 'text-accounting-red border-accounting-red/20 bg-accounting-red/5'
              }`}
            >
              <Lock className="inline w-3 h-3 mr-1 -mt-0.5" aria-hidden="true" />
              {mensajeError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-accounting-indigo dark:bg-zinc-700 text-accounting-paper dark:text-zinc-100 text-xs font-mono font-bold uppercase rounded-sm hover:bg-accounting-indigo/90 dark:hover:bg-zinc-600 focus:ring-1 focus:ring-accounting-green focus:outline-none transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            {isLoading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

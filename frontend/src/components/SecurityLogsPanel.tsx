import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, X } from 'lucide-react';
import { authApi } from '../api/client';
import type { LogSeguridad } from '../api/client';

const NIVEL_ESTILOS: Record<LogSeguridad['nivel'], string> = {
  INFO: 'text-accounting-green border-accounting-green/30 bg-accounting-green/10',
  WARNING: 'text-accounting-gold border-accounting-gold/30 bg-accounting-gold/10',
  ERROR: 'text-accounting-red border-accounting-red/30 bg-accounting-red/10',
  DEBUG: 'text-accounting-graphite border-accounting-graphite/30 bg-accounting-graphite/10'
};

interface Props {
  onClose: () => void;
}

export const SecurityLogsPanel = ({ onClose }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['logs-seguridad'],
    queryFn: () => authApi.getLogsSeguridad(),
    staleTime: 30 * 1000
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" role="dialog" aria-label="Bitácora de seguridad">
      <div className="max-w-3xl w-full max-h-[80vh] bg-white dark:bg-zinc-900 border border-accounting-indigo/15 dark:border-zinc-800 rounded-sm shadow-lg flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-accounting-indigo/10 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accounting-indigo dark:text-zinc-200" aria-hidden="true" />
            <h2 className="font-serif text-lg font-bold text-accounting-indigo dark:text-zinc-100">
              Bitácora de Seguridad
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar bitácora"
            className="p-1 rounded-sm hover:bg-accounting-indigo/10 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4 text-accounting-indigo dark:text-zinc-300" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {isLoading && <p className="text-xs font-mono text-accounting-graphite dark:text-zinc-400">Cargando eventos...</p>}
          {isError && <p className="text-xs font-mono text-accounting-red">No se pudo cargar la bitácora de seguridad.</p>}

          {data && (
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-accounting-graphite dark:text-zinc-400 border-b border-accounting-indigo/10 dark:border-zinc-800">
                  <th className="py-1.5 pr-3">Fecha</th>
                  <th className="py-1.5 pr-3">Usuario</th>
                  <th className="py-1.5 pr-3">Evento</th>
                  <th className="py-1.5 pr-3">Nivel</th>
                  <th className="py-1.5">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((log) => (
                  <tr key={log.id} className="border-b border-accounting-indigo/5 dark:border-zinc-800/50">
                    <td className="py-1.5 pr-3 text-accounting-graphite dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.fecha_hora).toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-3 text-accounting-indigo dark:text-zinc-200">{log.usuario}</td>
                    <td className="py-1.5 pr-3 text-accounting-indigo dark:text-zinc-200">{log.evento}</td>
                    <td className="py-1.5 pr-3">
                      <span className={`px-1.5 py-0.5 rounded-sm border ${NIVEL_ESTILOS[log.nivel]}`}>{log.nivel}</span>
                    </td>
                    <td className="py-1.5 text-accounting-graphite dark:text-zinc-400 max-w-xs truncate">
                      {log.detalle ? JSON.stringify(log.detalle) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.data.length === 0 && (
            <p className="text-xs font-mono text-accounting-graphite dark:text-zinc-400">Sin eventos registrados todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityLogsPanel;

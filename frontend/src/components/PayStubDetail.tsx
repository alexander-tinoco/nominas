import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { useEmpleadoDetalle, useNominaDetalle } from '../api/client';
import { useStore } from '../store/useStore';
import { X, Printer, ShieldCheck } from 'lucide-react';

export const PayStubDetail: React.FC = () => {
  const { selectedRfc, selectedQna, setSelectedRfc } = useStore();

  // Queries
  const { 
    data: empleadoInfo, 
    isLoading: loadingEmpleado, 
    isError: errorEmpleado 
  } = useEmpleadoDetalle(selectedRfc || '');

  // Encontrar el num_cons correspondiente a la quincena seleccionada
  const matchingRegistro = empleadoInfo?.historial.find(
    (h) => h.qna_pago === selectedQna
  );

  // Si no hay registro para la quincena seleccionada, usar el primero disponible en el historial
  const targetNumCons = matchingRegistro 
    ? matchingRegistro.num_cons 
    : (empleadoInfo?.historial[0]?.num_cons ?? null);

  const { 
    data: nominaDetalle, 
    isLoading: loadingNomina, 
    isError: errorNomina 
  } = useNominaDetalle(targetNumCons);

  const handlePrint = () => {
    window.print();
  };

  if (!selectedRfc) return null;

  if (loadingEmpleado || (targetNumCons !== null && loadingNomina)) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-12 gap-3 text-accounting-graphite dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-accounting-indigo/10 dark:border-zinc-800 rounded-sm"
        role="status"
        aria-live="polite"
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accounting-indigo dark:border-zinc-400"></div>
        <p className="font-mono text-xs">Imprimiendo talón contable...</p>
      </div>
    );
  }

  if (errorEmpleado || errorNomina || !nominaDetalle) {
    return (
      <div 
        className="p-6 bg-white dark:bg-zinc-900 border border-accounting-red/20 dark:border-red-950 rounded-sm"
        role="alert"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-serif text-sm font-bold text-accounting-red dark:text-red-400">Fallo de Recibo</h4>
          <button 
            onClick={() => setSelectedRfc(null)} 
            className="text-accounting-graphite dark:text-zinc-400 hover:text-accounting-indigo dark:hover:text-zinc-200 focus:ring-1 focus:ring-accounting-green focus:outline-none"
            aria-label="Cerrar aviso de error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-accounting-graphite dark:text-zinc-300">
          No se pudo generar el talón de nómina para el registro seleccionado.
        </p>
      </div>
    );
  }

  const handleBackToCatalog = () => {
    setSelectedRfc(null);
  };

  return (
    <div className="flex flex-col gap-6" role="region" aria-label="Detalle de recibo de nómina contable">
      {/* Botón de volver */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBackToCatalog}
          className="text-xs font-mono font-bold text-accounting-green dark:text-emerald-500 hover:underline flex items-center gap-1 focus:ring-1 focus:ring-accounting-green focus:outline-none"
          aria-label="Volver a la vista del catálogo contable de personal"
        >
          &larr; Volver al catálogo de personal
        </button>
        
        <button
          onClick={handlePrint}
          className="
            flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-accounting-indigo/20 dark:border-zinc-700 rounded-sm text-xs font-mono
            hover:bg-accounting-paper/30 dark:hover:bg-zinc-750 text-accounting-indigo dark:text-zinc-200 transition-colors duration-150 focus:ring-1 focus:ring-accounting-green focus:outline-none
          "
          aria-label="Imprimir recibo de nómina actual"
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Imprimir Recibo</span>
        </button>
      </div>

      {/* El Recibo de Nómina Perforado (Firma) */}
      <div 
        className="
          bg-white dark:bg-zinc-900 border-x border-accounting-indigo/25 dark:border-zinc-850 shadow-md 
          perforated-top perforated-bottom p-6 my-2 
          print:border-none print:shadow-none transition-colors duration-200
        "
        role="document"
        aria-label="Talón oficial digitalizado de nómina"
      >
        
        {/* Cabecera del talón */}
        <div className="border-b-2 border-dashed border-accounting-indigo/40 dark:border-zinc-700 pb-4 mb-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-accounting-graphite dark:text-zinc-400 font-bold">Comprobante de Pago</span>
              <h3 className="font-serif text-lg font-bold text-accounting-indigo dark:text-zinc-150 leading-tight">Estado de Nómina Oficial</h3>
            </div>
            <div className="text-right font-mono text-[10px] text-accounting-graphite dark:text-zinc-400">
              <div>FOLIO: <span className="font-bold text-accounting-indigo dark:text-zinc-200">{nominaDetalle.num_cons}</span></div>
              <div>QNA PAGO: <span className="font-bold text-accounting-indigo dark:text-zinc-200">{nominaDetalle.qna_pago}</span></div>
            </div>
          </div>

          {/* Datos del Empleado */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
            <div>
              <span className="block text-[9px] uppercase font-mono text-accounting-graphite dark:text-zinc-400">Beneficiario</span>
              <span className="font-bold text-accounting-indigo dark:text-zinc-200">{nominaDetalle.nom_emp}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-mono text-accounting-graphite dark:text-zinc-400">Clave RFC</span>
              <span className="font-mono font-bold text-accounting-indigo dark:text-zinc-200">{nominaDetalle.rfc}</span>
            </div>
          </div>
        </div>

        {/* Datos de la Plaza Contable */}
        <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-[10px] bg-accounting-paper/20 dark:bg-zinc-800/40 border border-accounting-indigo/10 dark:border-zinc-800 p-3 rounded-sm mb-6 font-mono">
          <div>
            <span className="block text-[8px] uppercase text-accounting-graphite dark:text-zinc-450 font-bold">Unidad / Subunidad</span>
            <span className="text-accounting-indigo dark:text-zinc-300">{nominaDetalle.unidad} / {nominaDetalle.subunidad}</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase text-accounting-graphite dark:text-zinc-450 font-bold">Cat. Puesto</span>
            <span className="text-accounting-indigo dark:text-zinc-300">{nominaDetalle.cat_puesto}</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase text-accounting-graphite dark:text-zinc-450 font-bold">Nivel Sueldo</span>
            <span className="text-accounting-indigo dark:text-zinc-300">{nominaDetalle.nivel_sueldo}</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase text-accounting-graphite dark:text-zinc-450 font-bold">Plaza Consecutivo</span>
            <span className="text-accounting-indigo dark:text-zinc-300">{nominaDetalle.cons_plaza}</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase text-accounting-graphite dark:text-zinc-450 font-bold">Horas</span>
            <span className="text-accounting-indigo dark:text-zinc-300">{nominaDetalle.horas} h.</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase text-accounting-graphite dark:text-zinc-450 font-bold">Ent. Federativa</span>
            <span className="text-accounting-indigo dark:text-zinc-300">{nominaDetalle.ent_fed}</span>
          </div>
        </div>

        {/* Tablas de Desglose: Percepciones vs Deducciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 border-b-2 border-dashed border-accounting-indigo/40 dark:border-zinc-700 pb-6 mb-4">
          
          {/* Percepciones */}
          <div className="border-r border-accounting-indigo/10 dark:border-zinc-800 pr-3 flex flex-col justify-between">
            <div>
              <div className="border-b border-accounting-indigo/20 dark:border-zinc-800 pb-1 mb-2">
                <span className="font-serif text-xs font-bold text-accounting-gold uppercase tracking-wider">Percepciones (+)</span>
              </div>
              {nominaDetalle.percepciones.length === 0 ? (
                <p className="text-[10px] italic text-accounting-graphite dark:text-zinc-400 py-1">Sin movimientos de percepción</p>
              ) : (
                <div className="flex flex-col gap-1 font-mono text-[11px]">
                  {nominaDetalle.percepciones.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                      <span className="text-accounting-indigo dark:text-zinc-300">Con. {p.concepto}</span>
                      <span className="text-accounting-indigo dark:text-zinc-300 text-right">{formatCurrency(p.importe)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Subtotal Percepciones */}
            <div className="border-t border-accounting-indigo/10 dark:border-zinc-850 pt-2 mt-4 flex justify-between font-mono text-xs font-bold text-accounting-gold">
              <span>TOTAL PERCEPCIONES</span>
              <span>{formatCurrency(nominaDetalle.tot_perc_cheque)}</span>
            </div>
          </div>

          {/* Deducciones */}
          <div className="pl-3 mt-6 md:mt-0 flex flex-col justify-between">
            <div>
              <div className="border-b border-accounting-indigo/20 dark:border-zinc-800 pb-1 mb-2">
                <span className="font-serif text-xs font-bold text-accounting-red uppercase tracking-wider">Deducciones (-)</span>
              </div>
              {nominaDetalle.deducciones.length === 0 ? (
                <p className="text-[10px] italic text-accounting-graphite dark:text-zinc-400 py-1">Sin movimientos de deducción</p>
              ) : (
                <div className="flex flex-col gap-1 font-mono text-[11px]">
                  {nominaDetalle.deducciones.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                      <span className="text-accounting-indigo dark:text-zinc-300">Con. {d.concepto}</span>
                      <span className="text-accounting-red text-right">-{formatCurrency(d.importe)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Subtotal Deducciones */}
            <div className="border-t border-accounting-indigo/10 dark:border-zinc-850 pt-2 mt-4 flex justify-between font-mono text-xs font-bold text-accounting-red">
              <span>TOTAL DEDUCCIONES</span>
              <span>-{formatCurrency(nominaDetalle.tot_ded_cheque)}</span>
            </div>
          </div>
        </div>

        {/* Sección Neto a Pagar */}
        <div className="flex flex-col items-end gap-1 mt-4">
          <span className="text-[9px] uppercase font-mono text-accounting-graphite dark:text-zinc-400 tracking-wider">Líquido a Recibir</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-accounting-green dark:text-emerald-500 tracking-tighter">
              {formatCurrency(nominaDetalle.tot_net_cheque)}
            </span>
          </div>
        </div>

        {/* Sello de Auditoría Contable */}
        <div className="flex justify-between items-center border-t border-accounting-indigo/10 dark:border-zinc-800 pt-6 mt-6">
          <div className="flex items-center gap-1.5 text-accounting-green dark:text-emerald-500 opacity-60">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            <span className="font-mono text-[8px] uppercase font-bold tracking-widest">Documento Auditado y Verificado</span>
          </div>
          <div className="w-32 h-6 border-b border-accounting-graphite/40 border-dashed text-center text-[8px] font-mono text-accounting-graphite/60 dark:text-zinc-400/60 pt-4">
            Firma Cajero
          </div>
        </div>
      </div>
      
      {/* Alerta de quincena disímil si aplica */}
      {matchingRegistro === undefined && (
        <div 
          className="p-3 bg-accounting-gold/10 border border-accounting-gold/30 rounded-sm text-[10px] font-sans text-accounting-graphite dark:text-zinc-300"
          role="alert"
        >
          ⚠️ <strong>Nota:</strong> No se detectó recibo para la quincena {selectedQna}. Mostrando el primer recibo histórico disponible del empleado ({nominaDetalle.qna_pago}).
        </div>
      )}
    </div>
  );
};

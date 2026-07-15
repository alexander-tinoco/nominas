import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

import { NominaRegistro } from '../../../api/client';

interface TablaResultadosProps {
  data: NominaRegistro[];
  onRowClick: (rfc: string, qna?: number) => void;
}

export const TablaResultados: React.FC<TablaResultadosProps> = ({ data, onRowClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left font-sans">
        <thead>
          <tr className="border-b border-accounting-indigo/30 text-[9px] uppercase tracking-wider text-accounting-graphite font-bold font-mono">
            <th className="py-2 px-2">RFC / Nombre</th>
            <th className="py-2 px-2 text-center">U / Sub</th>
            <th className="py-2 px-2 text-center">C.T.</th>
            <th className="py-2 px-2 text-center">Edad</th>
            <th className="py-2 px-2 text-right">Líquido Neto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-accounting-indigo/10 text-xs">
          {data.map((reg) => (
            <tr
              key={reg.num_cons}
              onClick={() => onRowClick(reg.rfc, reg.qna_pago)}
              className="bg-white hover:bg-accounting-paper/50 cursor-pointer transition-colors duration-150 group"
            >
              <td className="py-2 px-2 max-w-[150px] truncate text-accounting-indigo group-hover:text-accounting-green">
                <span className="font-mono text-xs font-bold block">{reg.rfc}</span>
                <span className="text-[10px] text-accounting-graphite group-hover:text-accounting-green">{reg.nom_emp}</span>
              </td>
              <td className="py-2 px-2 text-center font-mono text-accounting-indigo group-hover:text-accounting-green">
                {reg.unidad}/{reg.subunidad}
              </td>
              <td className="py-2 px-2 text-center font-mono text-accounting-indigo group-hover:text-accounting-green">
                {reg.ct_clasif}-{reg.ct_id}-{reg.ct_secuencial}
              </td>
              <td className="py-2 px-2 text-center font-mono text-accounting-indigo group-hover:text-accounting-green font-bold">
                {reg.edad !== null && reg.edad !== undefined ? `${reg.edad} a.` : 'N/D'}
              </td>
              <td className="py-2 px-2 text-right font-mono text-accounting-green font-bold">
                {formatCurrency(reg.tot_net_cheque)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

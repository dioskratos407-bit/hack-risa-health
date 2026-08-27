import React from 'react';
import { PatientSignal } from '@/lib/mockData';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Activity, Clock, ShieldAlert } from 'lucide-react';

export interface RiskTableProps {
  signals: PatientSignal[];
}

export const RiskTable: React.FC<RiskTableProps> = ({ signals }) => {
  const getRiskColor = (score: number) => {
    if (score >= 0.85) return 'bg-red-500 text-red-700';
    if (score >= 0.70) return 'bg-orange-500 text-orange-700';
    if (score >= 0.40) return 'bg-yellow-500 text-yellow-700';
    return 'bg-emerald-500 text-emerald-700';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse min-w-[650px]">
        <thead>
          <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
            <th scope="col" className="py-3.5 px-4 md:px-6">
              ID Paciente
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Tipo de Señal
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Score de Riesgo
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Prioridad
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Última Actualización
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {signals.map((signal) => {
            const percentage = Math.round(signal.riskScore * 100);
            return (
              <tr
                key={signal.id}
                className="bg-white hover:bg-slate-50/80 transition-colors duration-150 group"
              >
                {/* ID Paciente */}
                <td className="py-4 px-4 md:px-6 font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {signal.patientId.replace('PAT-', '')}
                    </div>
                    <div>
                      <span className="block text-slate-900 font-semibold">
                        {signal.patientId}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {signal.id}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Tipo de Señal */}
                <td className="py-4 px-4 md:px-6 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">
                      {signal.signalType}
                    </span>
                  </div>
                </td>

                {/* Score de Riesgo + Progress Bar */}
                <td className="py-4 px-4 md:px-6">
                  <div className="flex flex-col gap-1.5 max-w-[160px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-800">
                        {signal.riskScore.toFixed(2)}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getRiskColor(
                          signal.riskScore
                        ).split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Prioridad */}
                <td className="py-4 px-4 md:px-6">
                  <PriorityBadge priorityLevel={signal.priorityLevel} />
                </td>

                {/* Última Actualización */}
                <td className="py-4 px-4 md:px-6 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{signal.lastUpdate}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RiskTable;

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Activity, Clock, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DashboardSignal {
  id: string;
  patientId: string;
  riskScore: number;
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signalType: string;
  lastUpdate: string;
}

export interface RiskTableProps {
  signals: DashboardSignal[];
  loading?: boolean;
}

const PAGE_SIZE = 8;

export const RiskTable: React.FC<RiskTableProps> = ({ signals, loading }) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(signals.length / PAGE_SIZE));

  // Si el set de señales se reduce (nuevo fetch, filtro, etc.) y la página actual quedó
  // fuera de rango, la reajustamos -- pero sin resetear a la página 1 en cada refresh,
  // para no interrumpir al usuario mientras revisa registros antiguos.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const getRiskColor = (score: number) => {
    if (score >= 0.85) return 'bg-red-500 text-red-700';
    if (score >= 0.70) return 'bg-orange-500 text-orange-700';
    if (score >= 0.40) return 'bg-yellow-500 text-yellow-700';
    return 'bg-emerald-500 text-emerald-700';
  };

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageSignals = signals.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
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
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-4 px-4 md:px-6" colSpan={5}>
                    <div className="h-5 w-full rounded-md bg-slate-100 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : signals.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-6 h-6 text-slate-300" />
                    <span>Sin señales de riesgo activas. Inicia la simulación del sistema para generar alertas.</span>
                  </div>
                </td>
              </tr>
            ) : (
              pageSignals.map((signal) => {
                const percentage = Math.round(signal.riskScore * 100);
                return (
                  <tr key={signal.id} className="bg-white hover:bg-slate-50/80 transition-colors duration-150 group">
                    {/* ID Paciente */}
                    <td className="py-4 px-4 md:px-6 font-semibold text-slate-800">
                      <Link href={`/pacientes/${signal.patientId}`} className="flex items-center gap-2 w-fit cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {signal.patientId.replace('PAT-', '')}
                        </div>
                        <div>
                          <span className="block text-slate-900 font-semibold group-hover:text-blue-600 transition-colors">
                            {signal.patientId}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{signal.id}</span>
                        </div>
                      </Link>
                    </td>

                    {/* Tipo de Señal */}
                    <td className="py-4 px-4 md:px-6 text-slate-700">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800">{signal.signalType}</span>
                      </div>
                    </td>

                    {/* Score de Riesgo + Progress Bar */}
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex flex-col gap-1.5 max-w-[160px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-800">{signal.riskScore.toFixed(2)}</span>
                          <span className="text-slate-400 font-medium">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getRiskColor(signal.riskScore).split(' ')[0]}`}
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && signals.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500 font-medium">
            Mostrando {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, signals.length)} de {signals.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskTable;

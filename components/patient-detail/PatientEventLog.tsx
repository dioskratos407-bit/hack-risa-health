'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Monitor, Watch, HelpCircle, RadioTower, ChevronLeft, ChevronRight } from 'lucide-react';
import { TimelineRecord, VARIABLE_UNITS } from '@/components/patient-detail/useSimulatedClock';

export interface PatientEventLogProps {
  records: TimelineRecord[];
  currentTimeISO: string;
  loading?: boolean;
}

const PAGE_SIZE = 25;

function getSourceInfo(deviceId?: string | null) {
  if (!deviceId) {
    return { label: 'Origen no especificado', icon: HelpCircle, style: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  if (deviceId.startsWith('DEV-')) {
    return { label: 'Monitor Clínico', icon: Monitor, style: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (deviceId.startsWith('WRB-')) {
    return { label: 'Wearable Domiciliario', icon: Watch, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  return { label: 'Otro Dispositivo', icon: RadioTower, style: 'bg-purple-50 text-purple-700 border-purple-200' };
}

const formatTimestamp = (isoString: string) => isoString.replace('T', ' ').replace('Z', '');

export const PatientEventLog: React.FC<PatientEventLogProps> = ({ records, currentTimeISO, loading }) => {
  const [page, setPage] = useState(1);

  // Más reciente primero -- los registros llegan de la API en orden cronológico ascendente.
  const reversed = useMemo(() => [...records].reverse(), [records]);

  const totalPages = Math.max(1, Math.ceil(reversed.length / PAGE_SIZE));

  // Si el set se reduce (cambio de paciente, reset del reloj) y la página actual queda
  // fuera de rango, se reajusta -- pero no se vuelve a la página 1 cuando llegan
  // registros nuevos, para no interrumpir la lectura del historial antiguo.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const visible = reversed.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Registro Cronológico de Ingesta
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Cómo se van revelando los registros en el sistema a medida que avanza el reloj simulado
              (t ≤ {formatTimestamp(currentTimeISO)})
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-center">
          {records.length.toLocaleString('es')} Registros hasta t_sim
        </span>
      </div>

      {loading && records.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-10">Cargando registros...</div>
      ) : records.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-10">
          Sin registros revelados todavía para este instante simulado.
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                  <th scope="col" className="py-3 px-4">Hora de Registro</th>
                  <th scope="col" className="py-3 px-4">Variable</th>
                  <th scope="col" className="py-3 px-4">Valor</th>
                  <th scope="col" className="py-3 px-4">Origen del Registro</th>
                  <th scope="col" className="py-3 px-4">Dispositivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {visible.map((record, idx) => {
                  const source = getSourceInfo(record.device_id);
                  const SourceIcon = source.icon;
                  return (
                    <tr key={`${record.variable_code}-${record.timestamp}-${startIdx + idx}`} className="bg-white hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {formatTimestamp(record.timestamp)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 text-xs">{record.variable_code}</td>
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-700">
                        {record.value} <span className="text-slate-400">{VARIABLE_UNITS[record.variable_code] || ''}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${source.style}`}>
                          <SourceIcon className="w-3 h-3" />
                          {source.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-slate-500">{record.device_id || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, reversed.length)} de{' '}
              {reversed.length.toLocaleString('es')}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Más recientes
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600 px-2 whitespace-nowrap">
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
        </div>
      )}
    </div>
  );
};

export default PatientEventLog;

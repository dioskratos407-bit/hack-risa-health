'use client';

import React, { useEffect, useState } from 'react';
import { HeartPulse, FlaskConical, Pill, WifiOff, FileWarning } from 'lucide-react';
import {
  PatientClinicalContext,
  CONDITION_CATEGORY_LABELS,
  CONNECTIVITY_STATUS_LABELS,
  MEDICATION_CATEGORY_LABELS,
} from '@/lib/clinicalContext';

export interface PatientClinicalHistoryProps {
  patientId: string;
  currentTimeISO: string;
}

const formatTimestamp = (isoString: string) => isoString.replace('T', ' ').replace('Z', '');

function humanize(code: string): string {
  return code.toLowerCase().replace(/_/g, ' ');
}

// Tailwind necesita ver las clases completas de forma estática en el código fuente para
// generarlas -- una plantilla `bg-${color}-50` no funciona, así que cada color vive
// como una entrada completa en este mapa en vez de interpolarse.
const ICON_BADGE_STYLES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
};

const SectionHeader: React.FC<{
  icon: React.ElementType;
  color: keyof typeof ICON_BADGE_STYLES;
  title: string;
  subtitle: string;
  count: number;
}> = ({ icon: Icon, color, title, subtitle, count }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg border shrink-0 ${ICON_BADGE_STYLES[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 shrink-0">
      {count}
    </span>
  </div>
);

/**
 * Historial clínico complementario a los signos vitales: antecedentes, laboratorios,
 * medicación y conectividad del dispositivo. Sigue el mismo principio de viaje en el
 * tiempo que "Log de Eventos" (solo se revela lo que ya ocurrió hasta `currentTimeISO`),
 * pero con ventanas "de un tiempo X para atrás" en vez de todo el historial -- ver
 * lib/clinicalContext.ts para las ventanas por defecto.
 */
export const PatientClinicalHistory: React.FC<PatientClinicalHistoryProps> = ({
  patientId,
  currentTimeISO,
}) => {
  const [context, setContext] = useState<PatientClinicalContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTimeISO) return;
    let cancelled = false;
    setLoading((prev) => prev || context === null);

    fetch(
      `/api/patient-clinical-log?patientId=${encodeURIComponent(patientId)}&timeT=${encodeURIComponent(
        currentTimeISO
      )}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setContext(json.data);
          setError(null);
        } else {
          setError(json.error || 'No se pudo cargar el historial clínico.');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Error de conexión con el servidor.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, currentTimeISO]);

  const isEmpty =
    context &&
    context.activeConditions.length === 0 &&
    context.recentLabs.length === 0 &&
    context.recentMedications.length === 0 &&
    context.recentConnectivityEvents.length === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Historial Clínico Ampliado</h2>
        <p className="text-xs text-slate-500 font-medium">
          Antecedentes, laboratorios, medicación y conectividad revelados hasta t_sim (
          {formatTimestamp(currentTimeISO)}) -- mismo contexto que recibe el motor de diagnóstico
        </p>
      </div>

      {loading && !context ? (
        <div className="text-center text-slate-400 text-sm py-10">Cargando historial clínico...</div>
      ) : error ? (
        <div className="text-center text-red-500 text-sm py-10">{error}</div>
      ) : isEmpty ? (
        <div className="text-center text-slate-400 text-sm py-10">
          Sin antecedentes, laboratorios, medicación ni eventos de conectividad revelados todavía para
          este instante simulado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Antecedentes */}
          {context && context.activeConditions.length > 0 && (
            <div className="space-y-3">
              <SectionHeader
                icon={HeartPulse}
                color="amber"
                title="Antecedentes Activos"
                subtitle="Historia clínica relevante del paciente"
                count={context.activeConditions.length}
              />
              <div className="flex flex-wrap gap-2">
                {context.activeConditions.map((c) => (
                  <span
                    key={c.conditionId}
                    className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200"
                  >
                    {CONDITION_CATEGORY_LABELS[c.category] || humanize(c.category)}
                    <span className="text-amber-500 font-normal">desde {c.onsetDate}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Laboratorios recientes */}
          {context && context.recentLabs.length > 0 && (
            <div className="space-y-3">
              <SectionHeader
                icon={FlaskConical}
                color="cyan"
                title="Laboratorios Recientes"
                subtitle="Últimos 30 días de tiempo simulado"
                count={context.recentLabs.length}
              />
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {context.recentLabs.map((l) => (
                      <tr key={l.labResultId} className="bg-white hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {formatTimestamp(l.sampleDatetime)}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">{l.testName}</td>
                        <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {l.resultValue} {l.unit}
                        </td>
                        <td className="py-2 px-3">
                          {l.outOfRange ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                              <FileWarning className="w-3 h-3" /> fuera de rango
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medicación reciente */}
          {context && context.recentMedications.length > 0 && (
            <div className="space-y-3">
              <SectionHeader
                icon={Pill}
                color="violet"
                title="Medicación Reciente"
                subtitle="Últimos 30 días de tiempo simulado"
                count={context.recentMedications.length}
              />
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {context.recentMedications.map((m) => (
                      <tr key={m.administrationId} className="bg-white hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {formatTimestamp(m.startDatetime)}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">
                          {m.genericCategory
                            ? MEDICATION_CATEGORY_LABELS[m.genericCategory] || humanize(m.genericCategory)
                            : m.medicationId}
                        </td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {m.administrationRoute ? m.administrationRoute.toLowerCase() : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {m.doseValue} {m.doseUnit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Conectividad reciente */}
          {context && context.recentConnectivityEvents.length > 0 && (
            <div className="space-y-3">
              <SectionHeader
                icon={WifiOff}
                color="rose"
                title="Conectividad del Dispositivo"
                subtitle="Últimos 7 días de tiempo simulado"
                count={context.recentConnectivityEvents.length}
              />
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {context.recentConnectivityEvents.map((e) => (
                      <tr key={e.eventId} className="bg-white hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {formatTimestamp(e.startDatetime)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {CONNECTIVITY_STATUS_LABELS[e.connectivityStatus] ||
                              humanize(e.connectivityStatus)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {e.deviceId}
                        </td>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {e.delayedRecords} registros retrasados
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientClinicalHistory;

export type PatientState = 'ANALIZANDO' | 'DIAGNOSTICADO' | 'CON_ALERTAS' | 'SIN_ACTIVIDAD';

export interface PatientStateInfo {
  patientId: string;
  state: PatientState;
  insightCount: number;
  lastInsightAtISO: string | null;
  alertCount: number;
  topTier: 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
}

export interface PatientStateRaw {
  patientId: string;
  insightCount: number;
  lastInsightAtISO: string | null;
  alertCount: number;
  topTier: 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
}

export const PATIENT_STATE_LABELS: Record<PatientState, string> = {
  ANALIZANDO: 'Analizando (IA)',
  DIAGNOSTICADO: 'Diagnosticado',
  CON_ALERTAS: 'Con Alertas',
  SIN_ACTIVIDAD: 'Sin Actividad',
};

export const PATIENT_STATE_STYLES: Record<PatientState, { badge: string; dot: string; pulse: boolean }> = {
  ANALIZANDO: {
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: 'bg-violet-600',
    pulse: true,
  },
  DIAGNOSTICADO: {
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-600',
    pulse: false,
  },
  CON_ALERTAS: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    pulse: false,
  },
  SIN_ACTIVIDAD: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    pulse: false,
  },
};

/** Orden de prioridad para ordenar el directorio: lo accionable primero. */
export const PATIENT_STATE_RANK: Record<PatientState, number> = {
  ANALIZANDO: 3,
  DIAGNOSTICADO: 2,
  CON_ALERTAS: 1,
  SIN_ACTIVIDAD: 0,
};

/**
 * Estado mostrado de un paciente. "Analizando" es transitorio y gana sobre lo demás:
 * refleja que en este instante hay una llamada a la IA en vuelo para ese paciente.
 * El resto se deriva de lo que existe realmente en la base.
 */
export function derivePatientState(
  raw: PatientStateRaw | undefined,
  isAnalyzing: boolean
): PatientState {
  if (isAnalyzing) return 'ANALIZANDO';
  if (!raw) return 'SIN_ACTIVIDAD';
  if (raw.insightCount > 0) return 'DIAGNOSTICADO';
  if (raw.alertCount > 0) return 'CON_ALERTAS';
  return 'SIN_ACTIVIDAD';
}

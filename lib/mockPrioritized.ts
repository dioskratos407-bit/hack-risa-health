export interface PrioritizedPatient {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  riskScore: number; // Float between 0 and 1 (e.g. 0.95)
  alertReason: string;
  timestamp: string;
  /** Si el paciente ya tiene análisis contextual de IA generado. */
  hasDiagnosis: boolean;
  insightCount: number;
  /** Qué lo trajo a la bandeja: el motor de reglas o el análisis por contexto. */
  source: 'ALERT' | 'DIAGNOSIS';
}

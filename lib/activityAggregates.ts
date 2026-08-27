import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Agregación de actividad por paciente, compartida por /api/dashboard y
 * /api/patient-states. Vive en un solo lugar a propósito: cuando cada endpoint
 * calculaba lo suyo, el dashboard (que solo miraba risa_alerts) dejaba fuera a los
 * pacientes diagnosticados por contexto que nunca cruzaron un umbral, y las dos
 * pantallas mostraban números distintos.
 */

const PAGE_SIZE = 1000;

export type PriorityTier = 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const TIER_RANK: Record<PriorityTier, number> = { MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export interface AlertRow {
  id: number;
  patient_id: string;
  variable_code: string;
  value: number | null;
  timestamp: string;
  kind: 'VALUE_ANOMALY' | 'DATA_GAP';
  priority_tier: PriorityTier;
  priority_score: number;
  rule_reason: string;
  created_at: string;
}

export interface AlertAggregate {
  patientId: string;
  alertCount: number;
  /** Tier más alto alcanzado por el paciente (estable: no cambia al llegar alertas menores). */
  topTier: PriorityTier;
  /** Alerta representativa: la de mayor tier, desempatando por score y luego por recencia. */
  topAlert: AlertRow;
  /** Alerta más reciente, para el feed cronológico. */
  latestAlert: AlertRow;
}

export interface InsightAggregate {
  patientId: string;
  insightCount: number;
  lastInsightAtISO: string;
  lastAnalysis: string;
  /** Riesgo derivado del diagnóstico: context_score si existe, si no la fracción de
   * variables que la IA marcó como contribuyentes al riesgo. Ambos son datos reales. */
  riskScore: number | null;
}

/**
 * Trae TODAS las filas de una tabla paginando. PostgREST corta silenciosamente en 1000
 * filas por defecto, así que sin esto los conteos se congelan al crecer el volumen --
 * el mismo problema que ya apareció antes en /api/patient-timeline.
 */
export async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  orderColumn: string
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const page = (data || []) as T[];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function fetchAlertAggregates(
  supabase: SupabaseClient
): Promise<{ byPatient: Map<string, AlertAggregate>; allAlerts: AlertRow[] }> {
  const allAlerts = await fetchAllRows<AlertRow>(supabase, 'risa_alerts', '*', 'created_at');

  const byPatient = new Map<string, AlertAggregate>();

  for (const alert of allAlerts) {
    const existing = byPatient.get(alert.patient_id);

    if (!existing) {
      // allAlerts viene ordenado por created_at desc, así que la primera que vemos de
      // cada paciente es también su más reciente.
      byPatient.set(alert.patient_id, {
        patientId: alert.patient_id,
        alertCount: 1,
        topTier: alert.priority_tier,
        topAlert: alert,
        latestAlert: alert,
      });
      continue;
    }

    existing.alertCount++;

    const currentRank = TIER_RANK[existing.topAlert.priority_tier] || 0;
    const candidateRank = TIER_RANK[alert.priority_tier] || 0;
    const isMoreSevere =
      candidateRank > currentRank ||
      (candidateRank === currentRank && alert.priority_score > existing.topAlert.priority_score);

    if (isMoreSevere) {
      existing.topAlert = alert;
      existing.topTier = alert.priority_tier;
    }
  }

  return { byPatient, allAlerts };
}

interface InsightRow {
  patient_id: string;
  context_timestamp: string;
  objective_analysis: string;
  key_anomalies: { metric: string; isDanger: boolean }[] | null;
  context_score?: number | null;
}

export async function fetchInsightAggregates(
  supabase: SupabaseClient
): Promise<Map<string, InsightAggregate>> {
  // context_score es una columna opcional (puede no existir si no se corrió el ALTER
  // TABLE), así que se intenta con ella y se degrada al esquema base si falla.
  let rows: InsightRow[];
  try {
    rows = await fetchAllRows<InsightRow>(
      supabase,
      'risa_ai_insights',
      'patient_id, context_timestamp, objective_analysis, key_anomalies, context_score',
      'context_timestamp'
    );
  } catch {
    rows = await fetchAllRows<InsightRow>(
      supabase,
      'risa_ai_insights',
      'patient_id, context_timestamp, objective_analysis, key_anomalies',
      'context_timestamp'
    );
  }

  const byPatient = new Map<string, InsightAggregate>();

  for (const row of rows) {
    const existing = byPatient.get(row.patient_id);
    if (existing) {
      existing.insightCount++;
      continue;
    }

    // Ordenado por context_timestamp desc: el primero de cada paciente es el más reciente.
    let riskScore: number | null = null;
    if (typeof row.context_score === 'number') {
      riskScore = Math.min(100, row.context_score) / 100;
    } else if (row.key_anomalies && row.key_anomalies.length > 0) {
      riskScore = row.key_anomalies.filter((k) => k.isDanger).length / row.key_anomalies.length;
    }

    byPatient.set(row.patient_id, {
      patientId: row.patient_id,
      insightCount: 1,
      lastInsightAtISO: row.context_timestamp,
      lastAnalysis: row.objective_analysis,
      riskScore,
    });
  }

  return byPatient;
}

import { SupabaseClient } from '@supabase/supabase-js';
import { fetchAllRows, fetchAlertAggregates, PriorityTier } from '@/lib/activityAggregates';
import { mockPatientsList } from '@/lib/mockPatients';

/**
 * Correlaciones reales entre las tablas cargadas en las últimas iteraciones
 * (condiciones, laboratorios, conectividad) y las señales que ya calcula la app
 * (alertas del motor de reglas, diagnósticos de IA). Cada relación se expresa como un
 * conteo con su denominador -- nunca un coeficiente inventado -- porque el objetivo es
 * mostrar CÓMO se relacionan los datos, no simular un test estadístico que esta
 * población no necesariamente soporta.
 *
 * risa_conditions (~1,500 filas) y risa_laboratory_results (~4,600 filas) superan el
 * límite de 1,000 filas por página de PostgREST, así que se usa fetchAllRows (el mismo
 * helper que ya paginaba las alertas/insights) en vez de un .select() plano -- de lo
 * contrario los conteos se congelarían silenciosamente, el mismo bug que ya mordió a
 * /api/patient-timeline una vez.
 */

interface ConditionRow {
  patient_id: string;
  condition_category: string;
  status: string;
}

interface LabRow {
  patient_id: string;
  result_value: number;
  reference_low: number;
  reference_high: number;
}

interface ConnectivityRow {
  patient_id: string;
  connectivity_status: string;
}

interface MedicationAdminRow {
  patient_id: string;
}

interface InsightDangerRow {
  patient_id: string;
  key_anomalies: { metric: string; isDanger: boolean }[] | null;
}

export interface ConnectivityAlertCorrelation {
  withIssuesTotal: number;
  withIssuesHighRiskCount: number;
  withoutIssuesTotal: number;
  withoutIssuesHighRiskCount: number;
  statusBreakdown: { status: string; patientCount: number }[];
}

export interface ConditionCategoryCount {
  category: string;
  count: number;
}

export interface ConditionsPriorityCorrelation {
  criticalHighPatientTotal: number;
  otherPatientTotal: number;
  topCategoriesCriticalHigh: ConditionCategoryCount[];
  topCategoriesOther: ConditionCategoryCount[];
}

export interface LabsInsightCorrelation {
  outOfRangeTotal: number;
  outOfRangeWithDangerInsightCount: number;
}

export interface TableCoverage {
  table: string;
  label: string;
  patientCount: number;
}

export interface CrossDataCorrelations {
  totalPatientsInRoster: number;
  connectivityVsAlerts: ConnectivityAlertCorrelation;
  conditionsVsPriority: ConditionsPriorityCorrelation;
  labsVsInsights: LabsInsightCorrelation;
  coverage: TableCoverage[];
}

const HIGH_RISK_TIERS: PriorityTier[] = ['CRITICAL', 'HIGH'];

function topCategories(categoryCounts: Map<string, number>, limit = 5): ConditionCategoryCount[] {
  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function computeCrossDataCorrelations(
  supabase: SupabaseClient
): Promise<CrossDataCorrelations> {
  const [{ byPatient: alertsByPatient }, conditions, labs, connectivity, medicationAdmins, insights] =
    await Promise.all([
      fetchAlertAggregates(supabase),
      fetchAllRows<ConditionRow>(
        supabase,
        'risa_conditions',
        'patient_id,condition_category,status',
        'patient_id'
      ),
      fetchAllRows<LabRow>(
        supabase,
        'risa_laboratory_results',
        'patient_id,result_value,reference_low,reference_high',
        'patient_id'
      ),
      fetchAllRows<ConnectivityRow>(
        supabase,
        'risa_connectivity_events',
        'patient_id,connectivity_status',
        'patient_id'
      ),
      fetchAllRows<MedicationAdminRow>(
        supabase,
        'risa_medication_administrations',
        'patient_id',
        'patient_id'
      ),
      fetchAllRows<InsightDangerRow>(supabase, 'risa_ai_insights', 'patient_id,key_anomalies', 'patient_id'),
    ]);

  const isHighRisk = (patientId: string): boolean => {
    const tier = alertsByPatient.get(patientId)?.topTier;
    return !!tier && HIGH_RISK_TIERS.includes(tier);
  };

  // 1) Conectividad problemática <-> alertas de riesgo alto. risa_connectivity_events
  // solo registra INCIDENTES (DISCONNECTED/DELAYED_SYNC/INTERMITTENT, sin un estado
  // "OK"): aparecer en la tabla ya significa tener un problema de conectividad
  // registrado, así que el "sin problemas" se calcula contra el roster completo.
  const patientsWithConnIssues = new Set(connectivity.map((c) => c.patient_id));
  const patientsWithoutConnIssues = new Set(
    mockPatientsList.map((p) => p.id).filter((id) => !patientsWithConnIssues.has(id))
  );

  const statusPatients = new Map<string, Set<string>>();
  for (const c of connectivity) {
    if (!statusPatients.has(c.connectivity_status)) statusPatients.set(c.connectivity_status, new Set());
    statusPatients.get(c.connectivity_status)!.add(c.patient_id);
  }

  const connectivityVsAlerts: ConnectivityAlertCorrelation = {
    withIssuesTotal: patientsWithConnIssues.size,
    withIssuesHighRiskCount: Array.from(patientsWithConnIssues).filter(isHighRisk).length,
    withoutIssuesTotal: patientsWithoutConnIssues.size,
    withoutIssuesHighRiskCount: Array.from(patientsWithoutConnIssues).filter(isHighRisk).length,
    statusBreakdown: Array.from(statusPatients.entries()).map(([status, patients]) => ({
      status,
      patientCount: patients.size,
    })),
  };

  // 2) Antecedentes activos <-> nivel de prioridad.
  const activeConditions = conditions.filter((c) => c.status === 'ACTIVE');
  const criticalHighCategoryCounts = new Map<string, number>();
  const otherCategoryCounts = new Map<string, number>();
  const criticalHighPatients = new Set<string>();
  const otherConditionPatients = new Set<string>();

  for (const c of activeConditions) {
    if (isHighRisk(c.patient_id)) {
      criticalHighCategoryCounts.set(
        c.condition_category,
        (criticalHighCategoryCounts.get(c.condition_category) || 0) + 1
      );
      criticalHighPatients.add(c.patient_id);
    } else {
      otherCategoryCounts.set(c.condition_category, (otherCategoryCounts.get(c.condition_category) || 0) + 1);
      otherConditionPatients.add(c.patient_id);
    }
  }

  const conditionsVsPriority: ConditionsPriorityCorrelation = {
    criticalHighPatientTotal: criticalHighPatients.size,
    otherPatientTotal: otherConditionPatients.size,
    topCategoriesCriticalHigh: topCategories(criticalHighCategoryCounts),
    topCategoriesOther: topCategories(otherCategoryCounts),
  };

  // 3) Laboratorios fuera de rango <-> diagnóstico de IA con hallazgo peligroso. Mismo
  // chequeo de una línea que ya usa lib/clinicalContext.ts para outOfRange.
  const patientsWithOutOfRangeLabs = new Set(
    labs
      .filter((l) => l.result_value < l.reference_low || l.result_value > l.reference_high)
      .map((l) => l.patient_id)
  );
  const patientsWithDangerInsight = new Set(
    insights.filter((i) => (i.key_anomalies || []).some((k) => k.isDanger)).map((i) => i.patient_id)
  );

  const labsVsInsights: LabsInsightCorrelation = {
    outOfRangeTotal: patientsWithOutOfRangeLabs.size,
    outOfRangeWithDangerInsightCount: Array.from(patientsWithOutOfRangeLabs).filter((p) =>
      patientsWithDangerInsight.has(p)
    ).length,
  };

  // 4) Cobertura por tabla -- contexto, no hallazgo (no incluye risa_devices: por
  // construcción del dataset su cobertura es ~100% y no aporta nada nuevo como dato).
  const coverage: TableCoverage[] = [
    {
      table: 'risa_conditions',
      label: 'Antecedentes',
      patientCount: new Set(conditions.map((c) => c.patient_id)).size,
    },
    {
      table: 'risa_laboratory_results',
      label: 'Laboratorios',
      patientCount: new Set(labs.map((l) => l.patient_id)).size,
    },
    {
      table: 'risa_medication_administrations',
      label: 'Medicación',
      patientCount: new Set(medicationAdmins.map((m) => m.patient_id)).size,
    },
    { table: 'risa_connectivity_events', label: 'Conectividad', patientCount: patientsWithConnIssues.size },
  ];

  return {
    totalPatientsInRoster: mockPatientsList.length,
    connectivityVsAlerts,
    conditionsVsPriority,
    labsVsInsights,
    coverage,
  };
}

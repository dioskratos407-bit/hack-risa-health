import { NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { mockPatientsList } from "@/lib/mockPatients";
import {
  fetchAlertAggregates,
  fetchInsightAggregates,
  TIER_RANK,
  PriorityTier,
} from "@/lib/activityAggregates";


const VARIABLE_LABELS: Record<string, string> = {
  HR: "Frecuencia Cardíaca",
  SYS_BP: "Presión Sistólica",
  DIA_BP: "Presión Diastólica",
  RESP: "Frecuencia Respiratoria",
  SpO2: "Saturación de Oxígeno",
  TEMP: "Temperatura",
};

const RECENT_SIGNALS_LIMIT = 60;

/** Recorta un análisis largo a una sola frase para la tarjeta de la bandeja. */
function firstSentence(text: string, maxLength = 180): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.]+\./);
  const candidate = match ? match[0] : trimmed;
  return candidate.length > maxLength ? `${candidate.slice(0, maxLength - 1)}…` : candidate;
}

export async function GET() {
  try {
    const supabase = getReadClient();

    // "Pacientes evaluados" = el roster real navegable por la app (directorio de
    // /pacientes), no el conteo bruto de risa_master_data -- ese incluye pacientes que
    // no son accesibles desde la UI.
    const totalPatients = mockPatientsList.length;

    const [{ byPatient: alertsByPatient, allAlerts }, insightsByPatient] = await Promise.all([
      fetchAlertAggregates(supabase),
      fetchInsightAggregates(supabase),
    ]);

    // Los conteos usan el tier MÁS ALTO alcanzado por cada paciente, no el de su alerta
    // más reciente: así la tarjeta no cambia de valor cuando llega una alerta menor, y
    // coincide con el tier que muestra la bandeja de priorizados.
    let criticalCount = 0;
    let anomalyCount = 0;
    alertsByPatient.forEach((agg) => {
      if (agg.topTier === "CRITICAL") criticalCount++;
      anomalyCount++;
    });

    const diagnosedCount = insightsByPatient.size;

    const recentSignals = allAlerts.slice(0, RECENT_SIGNALS_LIMIT).map((a) => ({
      id: `ALT-${a.id}`,
      patientId: a.patient_id,
      riskScore: Math.min(a.priority_score, 100) / 100,
      priorityLevel: a.priority_tier,
      signalType:
        a.kind === "DATA_GAP"
          ? `Vacío de Datos — ${VARIABLE_LABELS[a.variable_code] || a.variable_code}`
          : VARIABLE_LABELS[a.variable_code] || a.variable_code,
      lastUpdateISO: a.created_at,
      timestampISO: a.timestamp,
    }));

    // La bandeja de priorizados incluye AMBAS fuentes: pacientes con alertas del motor
    // de reglas y pacientes diagnosticados por contexto (que pueden no haber cruzado
    // ningún umbral y antes quedaban invisibles aquí).
    const prioritized: {
      id: string;
      priority: PriorityTier;
      riskScore: number;
      alertReason: string;
      timestampISO: string;
      hasDiagnosis: boolean;
      insightCount: number;
      source: "ALERT" | "DIAGNOSIS";
    }[] = [];

    alertsByPatient.forEach((agg) => {
      const insight = insightsByPatient.get(agg.patientId);
      prioritized.push({
        id: agg.patientId,
        priority: agg.topTier,
        riskScore: Math.min(agg.topAlert.priority_score, 100) / 100,
        alertReason: agg.topAlert.rule_reason,
        timestampISO: agg.latestAlert.created_at,
        hasDiagnosis: !!insight,
        insightCount: insight?.insightCount ?? 0,
        source: "ALERT",
      });
    });

    insightsByPatient.forEach((agg) => {
      if (alertsByPatient.has(agg.patientId)) return; // ya incluido con su tier de alerta
      prioritized.push({
        id: agg.patientId,
        priority: "MEDIUM",
        riskScore: agg.riskScore ?? 0,
        alertReason: firstSentence(agg.lastAnalysis),
        timestampISO: agg.lastInsightAtISO,
        hasDiagnosis: true,
        insightCount: agg.insightCount,
        source: "DIAGNOSIS",
      });
    });

    prioritized.sort((a, b) => {
      const tierDiff = (TIER_RANK[b.priority] || 0) - (TIER_RANK[a.priority] || 0);
      if (tierDiff !== 0) return tierDiff;
      return b.riskScore - a.riskScore;
    });

    return NextResponse.json({
      success: true,
      totals: {
        totalPatients,
        criticalCount,
        anomalyCount,
        diagnosedCount,
      },
      recentSignals,
      prioritized,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

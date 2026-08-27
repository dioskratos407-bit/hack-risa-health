import { NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { fetchAlertAggregates, fetchInsightAggregates } from "@/lib/activityAggregates";


export interface PatientStateRow {
  patientId: string;
  insightCount: number;
  lastInsightAtISO: string | null;
  alertCount: number;
  topTier: "MEDIUM" | "HIGH" | "CRITICAL" | null;
}

/**
 * Estado real de cada paciente derivado de la base. Usa exactamente los mismos
 * agregados que /api/dashboard (lib/activityAggregates), así el directorio y el
 * dashboard nunca pueden reportar números distintos sobre los mismos datos.
 */
export async function GET() {
  try {
    const supabase = getReadClient();

    const [{ byPatient: alertsByPatient }, insightsByPatient] = await Promise.all([
      fetchAlertAggregates(supabase),
      fetchInsightAggregates(supabase),
    ]);

    const states = new Map<string, PatientStateRow>();

    const ensure = (patientId: string): PatientStateRow => {
      let row = states.get(patientId);
      if (!row) {
        row = { patientId, insightCount: 0, lastInsightAtISO: null, alertCount: 0, topTier: null };
        states.set(patientId, row);
      }
      return row;
    };

    insightsByPatient.forEach((agg) => {
      const row = ensure(agg.patientId);
      row.insightCount = agg.insightCount;
      row.lastInsightAtISO = agg.lastInsightAtISO;
    });

    alertsByPatient.forEach((agg) => {
      const row = ensure(agg.patientId);
      row.alertCount = agg.alertCount;
      row.topTier = agg.topTier;
    });

    return NextResponse.json({ success: true, states: Array.from(states.values()) });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

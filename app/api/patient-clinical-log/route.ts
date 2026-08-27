import { NextRequest, NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { fetchPatientClinicalContext } from "@/lib/clinicalContext";
import { validatePatientId, validateTimestamp, ValidationError } from "@/lib/validation";

/**
 * Contexto clínico ampliado de un paciente (antecedentes, laboratorios, medicación,
 * conectividad), acotado a "un tiempo X para atrás" desde `timeT` -- el mismo principio
 * de viaje en el tiempo que /api/patient-timeline, pero para las tablas nuevas en vez
 * de risa_master_data. No se le pasa `intervalStartISO`: usa las ventanas por defecto
 * de lib/clinicalContext.ts, pensadas para lectura humana (no la ventana incremental,
 * más corta, que usa el motor de IA).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = validatePatientId(searchParams.get("patientId"));
    const timeT = validateTimestamp(searchParams.get("timeT"), "timeT");

    const supabase = getReadClient();
    const context = await fetchPatientClinicalContext(supabase, patientId, timeT);

    return NextResponse.json({ success: true, data: context });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

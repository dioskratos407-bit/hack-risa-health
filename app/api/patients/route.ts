import { NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { PatientDemographics } from "@/lib/patientDemographics";

/**
 * Metadatos demográficos de los 1000 pacientes (risa_patients, una fila por
 * paciente). Se sirven completos en una sola llamada -- igual que /api/patient-states
 * -- porque el directorio filtra/ordena en el cliente sobre un roster fijo de 1000.
 */
export async function GET() {
  try {
    const supabase = getReadClient();
    const { data, error } = await supabase
      .from("risa_patients")
      .select(
        "patient_id,sex_at_birth,age_years,age_group,region_type,care_program,baseline_risk_profile,enrollment_date,active"
      )
      .order("patient_id", { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const patients: PatientDemographics[] = (data || []).map((row) => ({
      patientId: row.patient_id,
      sexAtBirth: row.sex_at_birth,
      ageYears: row.age_years,
      ageGroup: row.age_group,
      regionType: row.region_type,
      careProgram: row.care_program,
      baselineRiskProfile: row.baseline_risk_profile,
      enrollmentDate: row.enrollment_date,
      active: row.active,
    }));

    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

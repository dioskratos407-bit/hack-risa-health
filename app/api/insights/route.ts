import { NextRequest, NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { validatePatientId, ValidationError } from "@/lib/validation";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = validatePatientId(searchParams.get("patientId"));

    const supabase = getReadClient();
    const { data, error } = await supabase
      .from("risa_ai_insights")
      .select("*")
      .eq("patient_id", patientId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
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

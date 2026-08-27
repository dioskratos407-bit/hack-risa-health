import { NextRequest, NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { validatePatientId, ValidationError } from "@/lib/validation";


/**
 * Cada paciente tiene su propia ventana real de datos (están escalonadas ~1 día entre sí,
 * no comparten un rango fijo) -- este endpoint resuelve el min/max timestamp real de un
 * paciente para que el reloj simulado arranque y acote su rango correctamente en vez de
 * usar una fecha fija basada en PAT-0001.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = validatePatientId(searchParams.get("patientId"));

    const supabase = getReadClient();

    const [{ data: firstRow, error: firstError }, { data: lastRow, error: lastError }] = await Promise.all([
      supabase
        .from("risa_master_data")
        .select("timestamp")
        .eq("patient_id", patientId)
        .order("timestamp", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("risa_master_data")
        .select("timestamp")
        .eq("patient_id", patientId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (firstError || lastError) {
      return NextResponse.json(
        { success: false, error: (firstError || lastError)!.message },
        { status: 500 }
      );
    }

    if (!firstRow || !lastRow) {
      return NextResponse.json(
        { success: false, error: `No hay registros en risa_master_data para el paciente ${patientId}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, minTime: firstRow.timestamp, maxTime: lastRow.timestamp });
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

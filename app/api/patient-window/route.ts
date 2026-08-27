import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase credentials are missing from environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Cada paciente tiene su propia ventana real de datos (están escalonadas ~1 día entre sí,
 * no comparten un rango fijo) -- este endpoint resuelve el min/max timestamp real de un
 * paciente para que el reloj simulado arranque y acote su rango correctamente en vez de
 * usar una fecha fija basada en PAT-0001.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Falta el parámetro requerido: patientId." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

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
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

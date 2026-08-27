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
    const { data, error } = await supabase
      .from("risa_alerts")
      .select("*")
      .eq("patient_id", patientId)
      .order("timestamp", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

/**
 * Persiste una alerta del motor de reglas. Nota: esta ruta ya NO dispara el análisis
 * con IA -- el iniciador del diagnóstico es el cambio de contexto agregado del paciente
 * (ver lib/contextEngine.ts), no una alerta de umbral individual.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      variableCode,
      value,
      timestamp,
      kind,
      priorityTier,
      priorityScore,
      ruleReason,
    }: {
      patientId: string;
      variableCode: string;
      value: number | null;
      timestamp: string;
      kind: "VALUE_ANOMALY" | "DATA_GAP";
      priorityTier: "MEDIUM" | "HIGH" | "CRITICAL";
      priorityScore: number;
      ruleReason: string;
    } = body;

    if (!patientId || !variableCode || !timestamp || !priorityTier || !ruleReason || !kind) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Faltan campos requeridos. Debes proporcionar: patientId, variableCode, timestamp, kind, priorityTier, ruleReason.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: upserted, error: upsertError } = await supabase
      .from("risa_alerts")
      .upsert(
        {
          patient_id: patientId,
          variable_code: variableCode,
          value: value ?? null,
          timestamp,
          severity: priorityTier === "CRITICAL" ? "CRITICAL" : "WARNING",
          rule_reason: ruleReason,
          kind,
          priority_tier: priorityTier,
          priority_score: priorityScore,
        },
        { onConflict: "patient_id,variable_code,timestamp", ignoreDuplicates: true }
      )
      .select("*");

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    let alertRow = upserted && upserted.length > 0 ? upserted[0] : null;
    if (!alertRow) {
      const { data: existing, error: fetchError } = await supabase
        .from("risa_alerts")
        .select("*")
        .eq("patient_id", patientId)
        .eq("variable_code", variableCode)
        .eq("timestamp", timestamp)
        .maybeSingle();

      if (fetchError) {
        return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
      }
      alertRow = existing;
    }

    if (!alertRow) {
      return NextResponse.json(
        { success: false, error: "No se pudo crear ni recuperar la alerta." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: alertRow });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

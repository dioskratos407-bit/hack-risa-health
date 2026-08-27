import { NextRequest, NextResponse } from "next/server";
import { getReadClient, getWriteClient } from "@/lib/supabaseClient";
import {
  validatePatientId,
  validateTimestamp,
  validateVariableCode,
  validatePriorityTier,
  validateAlertKind,
  validateScore,
  validateMeasurement,
  sanitizeFreeText,
  ValidationError,
} from "@/lib/validation";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

// Escribe en la base, así que se acota para que no sirva como vector de inundación.
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60 * 1000;


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = validatePatientId(searchParams.get("patientId"));

    const supabase = getReadClient();
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
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
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
    const limit = checkRateLimit(`alerts:${getClientKey(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Demasiadas alertas por minuto. Reintenta en unos segundos." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();

    const patientId = validatePatientId(body?.patientId);
    const variableCode = validateVariableCode(body?.variableCode);
    const timestamp = validateTimestamp(body?.timestamp);
    const kind = validateAlertKind(body?.kind);
    const priorityTier = validatePriorityTier(body?.priorityTier);
    const priorityScore = validateScore(body?.priorityScore);
    const value = validateMeasurement(body?.value);
    const ruleReason = sanitizeFreeText(body?.ruleReason, "ruleReason");

    const supabase = getWriteClient();

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
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

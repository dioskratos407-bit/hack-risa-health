import { NextRequest, NextResponse } from "next/server";
import { getWriteClient } from "@/lib/supabaseClient";
import { runContextAnalysis } from "@/lib/contextEngine";
import { validatePatientId, validateTimestamp, ValidationError } from "@/lib/validation";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

// Este endpoint puede terminar en una llamada facturada al LLM, así que es el que más
// conviene acotar: un bucle accidental en el cliente agotaría la cuota.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;


/**
 * Dispara el análisis contextual incremental de un paciente anclado a un momento
 * simulado. El servidor decide si efectivamente se analiza (cooldown en tiempo
 * simulado + score de contexto) -- el cliente solo propone el momento.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(`analyze:${getClientKey(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Demasiadas solicitudes de análisis. Reintenta en unos segundos." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const patientId = validatePatientId(body?.patientId);
    const timeT = validateTimestamp(body?.timeT, "timeT");

    const supabase = getWriteClient();
    const outcome = await runContextAnalysis(supabase, patientId, timeT);

    return NextResponse.json({
      success: true,
      insightUpdated: outcome.analyzed,
      reason: outcome.reason,
      contextScore: outcome.contextScore ?? null,
    });
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

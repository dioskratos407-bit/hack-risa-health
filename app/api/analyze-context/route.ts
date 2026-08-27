import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runContextAnalysis } from "@/lib/contextEngine";

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
 * Dispara el análisis contextual incremental de un paciente anclado a un momento
 * simulado. El servidor decide si efectivamente se analiza (cooldown en tiempo
 * simulado + score de contexto) -- el cliente solo propone el momento.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, timeT }: { patientId?: string; timeT?: string } = body;

    if (!patientId || !timeT) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: patientId, timeT." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const outcome = await runContextAnalysis(supabase, patientId, timeT);

    return NextResponse.json({
      success: true,
      insightUpdated: outcome.analyzed,
      reason: outcome.reason,
      contextScore: outcome.contextScore ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

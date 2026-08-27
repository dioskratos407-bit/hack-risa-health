import { NextResponse } from "next/server";
import { getReadClient } from "@/lib/supabaseClient";
import { computeCrossDataCorrelations } from "@/lib/dataCorrelations";

/**
 * Correlaciones cruzadas entre todas las tablas cargadas (condiciones, laboratorios,
 * conectividad) y las señales que ya calcula la app (alertas, diagnósticos de IA). Sin
 * parámetros: es una vista agregada de todo lo cargado hasta ahora, igual que
 * "Pacientes Priorizados" (que tampoco está acotada a un reloj simulado por paciente).
 */
export async function GET() {
  try {
    const supabase = getReadClient();
    const data = await computeCrossDataCorrelations(supabase);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

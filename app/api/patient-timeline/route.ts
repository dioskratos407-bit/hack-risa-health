import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVariablesForCluster, getAllVariables } from "@/lib/clinicalClusters";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const timeT = searchParams.get("timeT");
    const cluster = searchParams.get("cluster");

    // Validación de parámetros obligatorios
    if (!patientId || !timeT || !cluster) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan parámetros requeridos. Debes proporcionar: patientId, timeT y cluster.",
        },
        { status: 400 }
      );
    }

    const variablesDelCluster =
      cluster.toUpperCase() === "ALL" ? getAllVariables() : getVariablesForCluster(cluster);
    if (!variablesDelCluster || variablesDelCluster.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `El clúster especificado ('${cluster}') no es válido o no contiene variables.`,
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase credentials are missing from environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Consulta a Supabase con filtro de Viaje en el Tiempo (<= timeT), paginada: sin
    // esto, PostgREST trunca silenciosamente cada respuesta a su límite por defecto
    // (1000 filas) -- con varios días de historial y varias variables (cluster=ALL),
    // el conteo real supera eso fácilmente y el reloj mostraba datos "congelados" antes
    // de timeT sin ningún error visible.
    const PAGE_SIZE = 1000;
    const allRows: any[] = [];
    let from = 0;

    while (true) {
      const { data: page, error } = await supabase
        .from("risa_master_data")
        .select("timestamp, variable_code, value, device_id")
        .eq("patient_id", patientId)
        .in("variable_code", variablesDelCluster)
        .lte("timestamp", timeT)
        .order("timestamp", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }

      allRows.push(...(page || []));
      if (!page || page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return NextResponse.json({
      success: true,
      simulatedTime: timeT,
      data: allRows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error procesando la solicitud.",
      },
      { status: 500 }
    );
  }
}

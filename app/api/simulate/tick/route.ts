import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { evaluatePoint, hasOwnCandidate, detectDataGap, CONTINUOUS_VARS, AnomalyDetection } from "@/lib/anomalyRules";
import { computeVariableStats, computeContextScore, TimedValue, VariableStats } from "@/lib/contextStats";
import { CONTEXT_SCORE_THRESHOLD } from "@/lib/contextEngine";

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

// Cuánto avanza el reloj de un paciente por visita del motor global. Con lecturas cada
// 20-60 min, una franja de 10h simuladas trae varios puntos nuevos por variable en cada
// tick -- suficiente para que el barrido round-robin sobre todo el roster produzca
// alertas de pacientes distintos en cuestión de segundos, sin tener que reprocesar el
// historial completo de cada uno en cada tick (eso sí sería costoso).
const STEP_MINUTES = 600;
const ACTIVITY_TOLERANCE_MS = 60 * 60 * 1000;
const CROSS_VAR_TOLERANCE_MS = 60 * 60 * 1000;
const HISTORY_BUFFER_LIMIT = 60;

// Presupuesto de IA por tick: aunque varios pacientes del lote muestren contexto
// cambiado, a lo sumo N llamadas a Gemini por tick (los de mayor score primero). Es lo
// que mantiene el costo acotado y predecible al escalar a muchos pacientes: el resto de
// candidatos vuelve a competir en el siguiente tick con su score actualizado.
const MAX_AI_ANALYSES_PER_TICK = 2;

interface PatientCursorInput {
  id: string;
  cursor?: string;
}

interface MasterRow {
  timestamp: string;
  variable_code: string;
  value: string | number;
}

function toNumeric(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value as string);
}

function findNearestAtOrBefore(
  records: MasterRow[],
  targetEpoch: number,
  toleranceMs: number
): MasterRow | undefined {
  for (let i = records.length - 1; i >= 0; i--) {
    const epoch = new Date(records[i].timestamp).getTime();
    if (epoch <= targetEpoch) {
      return targetEpoch - epoch <= toleranceMs ? records[i] : undefined;
    }
  }
  return undefined;
}

interface ProcessResult {
  id: string;
  newCursor?: string;
  done: boolean;
  alertsCreated: number;
  /** Fin de la ventana procesada (ancla temporal para el análisis contextual). */
  windowEndISO?: string;
  /** Score de contexto preliminar calculado con los datos ya traídos en este tick --
   * gate barato para decidir qué pacientes compiten por el presupuesto de IA. */
  preScore: number;
  insightUpdated?: boolean;
  contextScore?: number;
}

async function processPatient(
  supabase: SupabaseClient,
  patientId: string,
  cursor: string | undefined
): Promise<ProcessResult> {
  let windowStartISO = cursor;

  if (!windowStartISO) {
    const { data: firstRow } = await supabase
      .from("risa_master_data")
      .select("timestamp")
      .eq("patient_id", patientId)
      .order("timestamp", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!firstRow) return { id: patientId, newCursor: undefined, done: true, alertsCreated: 0, preScore: 0 };
    windowStartISO = firstRow.timestamp;
  }

  const { data: lastRow } = await supabase
    .from("risa_master_data")
    .select("timestamp")
    .eq("patient_id", patientId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  const windowStartEpoch = new Date(windowStartISO!).getTime();
  const maxEpoch = lastRow ? new Date(lastRow.timestamp).getTime() : windowStartEpoch;

  let newCursorEpoch = windowStartEpoch + STEP_MINUTES * 60 * 1000;
  let done = false;
  if (newCursorEpoch >= maxEpoch) {
    newCursorEpoch = maxEpoch;
    done = true;
  }
  const newCursorISO = new Date(newCursorEpoch).toISOString();

  const [{ data: bufferRowsDesc }, { data: newRowsAsc }] = await Promise.all([
    supabase
      .from("risa_master_data")
      .select("timestamp,variable_code,value")
      .eq("patient_id", patientId)
      .lt("timestamp", windowStartISO)
      .order("timestamp", { ascending: false })
      .limit(HISTORY_BUFFER_LIMIT),
    supabase
      .from("risa_master_data")
      .select("timestamp,variable_code,value")
      .eq("patient_id", patientId)
      .gte("timestamp", windowStartISO)
      .lte("timestamp", newCursorISO)
      .order("timestamp", { ascending: true }),
  ]);

  const buffer = (bufferRowsDesc || []).slice().reverse();
  const newSlice = newRowsAsc || [];
  const combined: MasterRow[] = [...buffer, ...newSlice];

  const byVariable: Record<string, MasterRow[]> = {};
  combined.forEach((r) => {
    if (!byVariable[r.variable_code]) byVariable[r.variable_code] = [];
    byVariable[r.variable_code].push(r);
  });

  const activityRecords = byVariable["ACTIVITY_LEVEL"] || [];
  const detections: AnomalyDetection[] = [];

  CONTINUOUS_VARS.forEach((varCode) => {
    const all = byVariable[varCode];
    if (!all || all.length === 0) return;

    all.forEach((record, idx) => {
      const epoch = new Date(record.timestamp).getTime();
      if (epoch < windowStartEpoch) return; // ya evaluado en un tick anterior

      const numericValue = toNumeric(record.value);
      const history = all
        .slice(0, idx)
        .map((r) => toNumeric(r.value))
        .filter((v) => !isNaN(v));
      const nextValue = idx + 1 < all.length ? toNumeric(all[idx + 1].value) : undefined;

      const nearestActivity = findNearestAtOrBefore(activityRecords, epoch, ACTIVITY_TOLERANCE_MS);
      const activityLevel = nearestActivity ? String(nearestActivity.value) : undefined;

      const otherActiveTrends: string[] = [];
      CONTINUOUS_VARS.forEach((otherVar) => {
        if (otherVar === varCode) return;
        const otherRecords = byVariable[otherVar];
        if (!otherRecords || otherRecords.length === 0) return;
        const nearest = findNearestAtOrBefore(otherRecords, epoch, CROSS_VAR_TOLERANCE_MS);
        if (!nearest) return;
        const nearestIdx = otherRecords.indexOf(nearest);
        const otherHistory = otherRecords
          .slice(0, nearestIdx)
          .map((r) => toNumeric(r.value))
          .filter((v) => !isNaN(v));
        if (hasOwnCandidate(otherVar, toNumeric(nearest.value), otherHistory)) {
          otherActiveTrends.push(otherVar);
        }
      });

      const detection = evaluatePoint({
        variableCode: varCode,
        value: numericValue,
        timestamp: record.timestamp,
        history,
        nextValue,
        activityLevel,
        otherActiveTrends,
      });
      if (detection) detections.push(detection);
    });
  });

  // Patrón 5 (vacío de datos): solo se evalúa cuando este tick cruza a una nueva hora
  // simulada, como en el reloj por-paciente -- evita reportar el mismo vacío en cada tick.
  const startHourBucket = Math.floor(windowStartEpoch / (60 * 60 * 1000));
  const endHourBucket = Math.floor(newCursorEpoch / (60 * 60 * 1000));
  if (endHourBucket !== startHourBucket) {
    CONTINUOUS_VARS.forEach((varCode) => {
      const timestamps = (byVariable[varCode] || []).map((r) => r.timestamp);
      const gap = detectDataGap(varCode, timestamps, newCursorISO);
      if (gap) detections.push(gap);
    });
  }

  let alertsCreated = 0;
  for (const detection of detections) {
    const { data, error } = await supabase
      .from("risa_alerts")
      .upsert(
        {
          patient_id: patientId,
          variable_code: detection.variableCode,
          value: isNaN(detection.value) ? null : detection.value,
          timestamp: detection.timestamp,
          severity: detection.priorityTier === "CRITICAL" ? "CRITICAL" : "WARNING",
          rule_reason: detection.ruleReason,
          kind: detection.kind,
          priority_tier: detection.priorityTier,
          priority_score: detection.priorityScore,
        },
        { onConflict: "patient_id,variable_code,timestamp", ignoreDuplicates: true }
      )
      .select("id");
    if (!error && data && data.length > 0) alertsCreated++;
  }

  // Pre-score de contexto con los datos ya en memoria (baseline = buffer previo a la
  // ventana, intervalo = la ventana nueva): gate barato que decide si este paciente
  // compite por el presupuesto de análisis con IA de este tick.
  const timedByVariable: Record<string, TimedValue[]> = {};
  for (const varCode of CONTINUOUS_VARS) {
    timedByVariable[varCode] = (byVariable[varCode] || []).map((r) => ({
      timestamp: r.timestamp,
      value: toNumeric(r.value),
    }));
  }
  const statsList: VariableStats[] = [];
  for (const varCode of CONTINUOUS_VARS) {
    const s = computeVariableStats(varCode, timedByVariable[varCode], windowStartEpoch);
    if (s) statsList.push(s);
  }
  const preScore = statsList.length > 0 ? computeContextScore(statsList) : 0;

  // Al terminar la ventana de datos del paciente, se reinicia (cursor undefined) para
  // que el barrido round-robin lo vuelva a recorrer desde el inicio en la próxima vuelta
  // -- así el dashboard sigue "vivo" en vez de quedarse sin nada que mostrar tras un ciclo.
  return {
    id: patientId,
    newCursor: done ? undefined : newCursorISO,
    done,
    alertsCreated,
    windowEndISO: newCursorISO,
    preScore,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const patients: PatientCursorInput[] = body.patients || [];
    if (!Array.isArray(patients) || patients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Falta el campo requerido: patients (array de { id, cursor? })." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const results = await Promise.all(
      patients.map((p) => processPatient(supabase, p.id, p.cursor))
    );

    // Selección de candidatos a análisis con IA: los pacientes cuyo contexto cambió
    // (pre-score sobre el umbral) compiten por el presupuesto del tick, mayor score
    // primero. El análisis en sí NO corre aquí: se devuelven los candidatos para que el
    // cliente los dispare contra /api/analyze-context. Así el tick no se bloquea
    // esperando a Gemini y la UI puede mostrar en tiempo real qué paciente se está
    // analizando (estado "Analizando" del directorio), en vez de enterarse después.
    const aiCandidates = results
      .filter((r) => r.windowEndISO && r.preScore >= CONTEXT_SCORE_THRESHOLD)
      .sort((a, b) => b.preScore - a.preScore)
      .slice(0, MAX_AI_ANALYSES_PER_TICK)
      .map((r) => ({ id: r.id, timeT: r.windowEndISO!, preScore: r.preScore }));

    return NextResponse.json({ success: true, results, aiCandidates });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

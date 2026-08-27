import { SupabaseClient } from '@supabase/supabase-js';
import { CONTINUOUS_VARS } from '@/lib/anomalyRules';
import {
  computeVariableStats,
  computePairwiseCorrelations,
  computeContextScore,
  TimedValue,
  VariableStats,
} from '@/lib/contextStats';
import { generateIncrementalDiagnosis } from '@/lib/gemini';

/** Mínimo de tiempo SIMULADO entre dos análisis del mismo paciente (x -> x + t). */
export const ANALYSIS_MIN_INTERVAL_SIM_MS = 6 * 60 * 60 * 1000;
/** Score de contexto mínimo para gastar una llamada a la IA. */
export const CONTEXT_SCORE_THRESHOLD = 40;
/** Recencia: nunca se analizan datos crudos más viejos que esto respecto al momento
 * del análisis -- lo anterior ya está comprimido en el diagnóstico previo. */
const MAX_RAW_LOOKBACK_MS = 24 * 60 * 60 * 1000;
/** Lecturas previas al intervalo usadas como baseline estadístico. */
const BASELINE_ROWS_LIMIT = 80;
const MIN_INTERVAL_ROWS = 4;

export interface ContextAnalysisOutcome {
  analyzed: boolean;
  reason: 'analyzed' | 'cooldown' | 'low-score' | 'no-data' | 'gemini-error';
  contextScore?: number;
}

interface MasterRow {
  timestamp: string;
  variable_code: string;
  value: string | number;
}

function toNumeric(value: string | number): number {
  return typeof value === 'number' ? value : parseFloat(value as string);
}

/**
 * Análisis contextual incremental de un paciente, anclado al momento simulado
 * `windowEndISO` (x + t):
 *
 * 1. Recupera el diagnóstico previo (momento x). Si x + t - x < cooldown, no analiza.
 * 2. Solo trae de la BD el intervalo (x, x+t] + un buffer de baseline -- nunca el
 *    historial completo: lo anterior a x ya quedó comprimido en el diagnóstico previo.
 * 3. Comprime el intervalo a estadísticas (Δ%, z, pendientes, correlaciones de Pearson)
 *    calculadas localmente, y computa el score de contexto agregado.
 * 4. Solo si el contexto cambió lo suficiente (score >= umbral) llama a la IA, pasándole
 *    las estadísticas + el diagnóstico previo -- nunca datos crudos.
 * 5. Persiste el nuevo diagnóstico con context_timestamp = x + t, que será el punto de
 *    partida del siguiente análisis.
 */
export async function runContextAnalysis(
  supabase: SupabaseClient,
  patientId: string,
  windowEndISO: string
): Promise<ContextAnalysisOutcome> {
  const windowEndEpoch = new Date(windowEndISO).getTime();
  if (isNaN(windowEndEpoch)) return { analyzed: false, reason: 'no-data' };

  // Cooldown relativo al momento analizado (no al insight más reciente en absoluto):
  // así el reloj puede "reproducirse" de nuevo desde el inicio (round-robin del motor
  // global, o reset manual del reloj de un paciente) sin quedar bloqueado por insights
  // generados en momentos simulados posteriores.
  const cooldownStartISO = new Date(windowEndEpoch - ANALYSIS_MIN_INTERVAL_SIM_MS).toISOString();
  const { count: recentInsights } = await supabase
    .from('risa_ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patientId)
    .gt('context_timestamp', cooldownStartISO)
    .lte('context_timestamp', windowEndISO);

  if ((recentInsights ?? 0) > 0) {
    return { analyzed: false, reason: 'cooldown' };
  }

  // Memoria: el diagnóstico previo es el último ANTERIOR al momento analizado.
  const { data: lastInsight } = await supabase
    .from('risa_ai_insights')
    .select('context_timestamp, objective_analysis')
    .eq('patient_id', patientId)
    .lte('context_timestamp', windowEndISO)
    .order('context_timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastEpoch = lastInsight?.context_timestamp
    ? new Date(lastInsight.context_timestamp).getTime()
    : null;

  // Intervalo incremental: desde el último diagnóstico (x), acotado por recencia.
  const intervalStartEpoch = Math.max(
    lastEpoch ?? windowEndEpoch - MAX_RAW_LOOKBACK_MS,
    windowEndEpoch - MAX_RAW_LOOKBACK_MS
  );
  const intervalStartISO = new Date(intervalStartEpoch).toISOString();

  const relevantVars = [...CONTINUOUS_VARS, 'ACTIVITY_LEVEL'];
  const [{ data: intervalRows }, { data: baselineRowsDesc }] = await Promise.all([
    supabase
      .from('risa_master_data')
      .select('timestamp,variable_code,value')
      .eq('patient_id', patientId)
      .in('variable_code', relevantVars)
      .gt('timestamp', intervalStartISO)
      .lte('timestamp', windowEndISO)
      .order('timestamp', { ascending: true }),
    supabase
      .from('risa_master_data')
      .select('timestamp,variable_code,value')
      .eq('patient_id', patientId)
      .in('variable_code', CONTINUOUS_VARS)
      .lte('timestamp', intervalStartISO)
      .order('timestamp', { ascending: false })
      .limit(BASELINE_ROWS_LIMIT),
  ]);

  const interval = (intervalRows || []) as MasterRow[];
  const baseline = ((baselineRowsDesc || []) as MasterRow[]).slice().reverse();

  if (interval.length < MIN_INTERVAL_ROWS) return { analyzed: false, reason: 'no-data' };

  const byVariable: Record<string, TimedValue[]> = {};
  for (const row of [...baseline, ...interval]) {
    if (row.variable_code === 'ACTIVITY_LEVEL') continue;
    if (!byVariable[row.variable_code]) byVariable[row.variable_code] = [];
    byVariable[row.variable_code].push({ timestamp: row.timestamp, value: toNumeric(row.value) });
  }

  const stats: VariableStats[] = [];
  for (const varCode of CONTINUOUS_VARS) {
    const s = computeVariableStats(varCode, byVariable[varCode] || [], intervalStartEpoch);
    if (s) stats.push(s);
  }
  if (stats.length === 0) return { analyzed: false, reason: 'no-data' };

  const contextScore = computeContextScore(stats);
  if (contextScore < CONTEXT_SCORE_THRESHOLD) {
    return { analyzed: false, reason: 'low-score', contextScore };
  }

  const correlations = computePairwiseCorrelations(byVariable, intervalStartEpoch);

  // Nivel de actividad predominante del intervalo (moda).
  const activityCounts = new Map<string, number>();
  for (const row of interval) {
    if (row.variable_code !== 'ACTIVITY_LEVEL') continue;
    const level = String(row.value);
    activityCounts.set(level, (activityCounts.get(level) || 0) + 1);
  }
  let activityLevel: string | undefined;
  let maxCount = 0;
  activityCounts.forEach((count, level) => {
    if (count > maxCount) {
      maxCount = count;
      activityLevel = level;
    }
  });

  try {
    const insight = await generateIncrementalDiagnosis({
      patientId,
      windowStartISO: intervalStartISO,
      windowEndISO,
      previousDiagnosis: lastInsight?.objective_analysis ?? null,
      stats,
      correlations,
      activityLevel,
      contextScore,
    });

    const baseRow = {
      patient_id: patientId,
      context_timestamp: windowEndISO,
      objective_analysis: insight.objectiveAnalysis,
      analyzed_variables: stats.map((s) => s.variableCode),
      key_anomalies: insight.keyAnomalies,
    };

    // context_score y stats_snapshot son columnas opcionales (el usuario puede no haber
    // corrido aún el ALTER TABLE) -- si el insert extendido falla, degradamos al esquema base.
    const { error: extendedError } = await supabase.from('risa_ai_insights').insert({
      ...baseRow,
      context_score: contextScore,
      stats_snapshot: stats.map((s) => ({
        variableCode: s.variableCode,
        nInterval: s.nInterval,
        intervalMean: s.intervalMean,
        baselineMean: s.baselineMean,
        deltaPct: s.deltaPct,
        zLatest: s.zLatest,
        slopePerHour: s.slopePerHour,
        clinicalFlag: s.clinicalFlag,
      })),
    });

    if (extendedError) {
      const { error: baseError } = await supabase.from('risa_ai_insights').insert(baseRow);
      if (baseError) return { analyzed: false, reason: 'gemini-error', contextScore };
    }

    return { analyzed: true, reason: 'analyzed', contextScore };
  } catch {
    return { analyzed: false, reason: 'gemini-error', contextScore };
  }
}

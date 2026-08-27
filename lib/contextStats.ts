import { CLINICAL_THRESHOLDS, TREND_MIN_ABS_DEVIATION, CONTINUOUS_VARS } from '@/lib/anomalyRules';
import { VARIABLE_LABELS, VARIABLE_UNITS } from '@/lib/variableMeta';

/**
 * Compresión estadística del contexto de un paciente: en vez de mandarle a la IA los
 * datos crudos (caro en tokens y no escalable a muchos pacientes), todo el trabajo
 * numérico se hace aquí de forma determinística y gratuita, y la IA recibe solo el
 * vector de estadísticas resultante + el diagnóstico previo como memoria comprimida
 * de todo lo anterior al intervalo analizado.
 */

export interface TimedValue {
  timestamp: string;
  value: number;
}

export interface VariableStats {
  variableCode: string;
  label: string;
  unit: string;
  /** Lecturas dentro del intervalo (x, x+t]. */
  nInterval: number;
  intervalMean: number;
  intervalStd: number;
  first: number;
  last: number;
  min: number;
  max: number;
  /** Media del baseline (lecturas anteriores al intervalo), si hay suficientes. */
  baselineMean: number | null;
  baselineStd: number | null;
  /** Variación % de la media del intervalo respecto al baseline (o último vs primero si no hay baseline). */
  deltaPct: number | null;
  /** z-score del último valor respecto al baseline. */
  zLatest: number | null;
  /** Pendiente por mínimos cuadrados dentro del intervalo, en unidades/hora. */
  slopePerHour: number | null;
  /** Últimos valores del intervalo (para sparkline en UI). */
  recentValues: number[];
  /** Si el último valor está fuera del rango clínico de advertencia/crítico. */
  clinicalFlag: 'NONE' | 'WARNING' | 'CRITICAL';
  /** Fracción [0,1] de lecturas del intervalo fuera del rango de advertencia -- a
   * diferencia de la media, no se diluye cuando el episodio anómalo es corto respecto
   * al intervalo analizado. */
  pctOutOfRange: number;
}

export interface VariableCorrelation {
  varA: string;
  varB: string;
  /** Coeficiente de Pearson sobre buckets horarios comunes del intervalo. */
  r: number;
  n: number;
}

const SPARKLINE_POINTS = 10;
const MIN_BASELINE_POINTS = 3;
const MIN_CORRELATION_BUCKETS = 4;
const CORRELATION_MIN_ABS_R = 0.5;

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[], mu: number): number {
  return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / xs.length);
}

function clinicalFlagFor(variableCode: string, value: number): 'NONE' | 'WARNING' | 'CRITICAL' {
  const rule = CLINICAL_THRESHOLDS[variableCode];
  if (!rule) return 'NONE';
  if (
    (rule.criticalLow !== undefined && value < rule.criticalLow) ||
    (rule.criticalHigh !== undefined && value > rule.criticalHigh)
  ) {
    return 'CRITICAL';
  }
  if (
    (rule.warningLow !== undefined && value < rule.warningLow) ||
    (rule.warningHigh !== undefined && value > rule.warningHigh)
  ) {
    return 'WARNING';
  }
  return 'NONE';
}

/**
 * Estadísticas de una variable sobre el intervalo incremental (registros con
 * timestamp > intervalStartEpoch), usando los registros previos como baseline.
 */
export function computeVariableStats(
  variableCode: string,
  records: TimedValue[],
  intervalStartEpoch: number
): VariableStats | null {
  const baseline: number[] = [];
  const interval: TimedValue[] = [];
  for (const r of records) {
    if (isNaN(r.value)) continue;
    if (new Date(r.timestamp).getTime() > intervalStartEpoch) interval.push(r);
    else baseline.push(r.value);
  }
  if (interval.length === 0) return null;

  const values = interval.map((r) => r.value);
  const intervalMean = mean(values);
  const intervalStd = std(values, intervalMean);
  const first = values[0];
  const last = values[values.length - 1];

  let baselineMean: number | null = null;
  let baselineStd: number | null = null;
  if (baseline.length >= MIN_BASELINE_POINTS) {
    baselineMean = mean(baseline);
    baselineStd = std(baseline, baselineMean);
  }

  let deltaPct: number | null = null;
  if (baselineMean !== null && Math.abs(baselineMean) > 1e-9) {
    deltaPct = ((intervalMean - baselineMean) / Math.abs(baselineMean)) * 100;
  } else if (Math.abs(first) > 1e-9) {
    deltaPct = ((last - first) / Math.abs(first)) * 100;
  }

  // z-score con el mismo piso de desviación absoluta del motor de reglas: un z alto
  // sobre un baseline casi plano no cuenta si la magnitud es clínicamente trivial.
  let zLatest: number | null = null;
  if (baselineMean !== null && baselineStd !== null && baselineStd > 1e-9) {
    const minAbsDev = TREND_MIN_ABS_DEVIATION[variableCode] ?? 0;
    const absDeviation = Math.abs(last - baselineMean);
    zLatest = absDeviation >= minAbsDev ? (last - baselineMean) / baselineStd : 0;
  }

  let slopePerHour: number | null = null;
  if (interval.length >= 3) {
    const t0 = new Date(interval[0].timestamp).getTime();
    const xs = interval.map((r) => (new Date(r.timestamp).getTime() - t0) / (60 * 60 * 1000));
    const xMean = mean(xs);
    const yMean = intervalMean;
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - xMean) * (values[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    slopePerHour = den > 1e-9 ? num / den : null;
  }

  return {
    variableCode,
    label: VARIABLE_LABELS[variableCode] || variableCode,
    unit: VARIABLE_UNITS[variableCode] || '',
    nInterval: interval.length,
    intervalMean,
    intervalStd,
    first,
    last,
    min: Math.min(...values),
    max: Math.max(...values),
    baselineMean,
    baselineStd,
    deltaPct,
    zLatest,
    slopePerHour,
    recentValues: values.slice(-SPARKLINE_POINTS),
    clinicalFlag: clinicalFlagFor(variableCode, last),
    pctOutOfRange: values.filter((v) => clinicalFlagFor(variableCode, v) !== 'NONE').length / values.length,
  };
}

/**
 * Correlaciones de Pearson entre pares de variables continuas, sobre buckets horarios
 * comunes del intervalo -- es la evidencia numérica con la que la IA puede afirmar
 * "estas variables se movieron juntas" sin inventarlo.
 */
export function computePairwiseCorrelations(
  byVariable: Record<string, TimedValue[]>,
  intervalStartEpoch: number
): VariableCorrelation[] {
  const hourlyMeans: Record<string, Map<number, number>> = {};

  for (const varCode of CONTINUOUS_VARS) {
    const records = byVariable[varCode] || [];
    const buckets = new Map<number, { sum: number; n: number }>();
    for (const r of records) {
      const epoch = new Date(r.timestamp).getTime();
      if (epoch <= intervalStartEpoch || isNaN(r.value)) continue;
      const hour = Math.floor(epoch / (60 * 60 * 1000));
      const b = buckets.get(hour) || { sum: 0, n: 0 };
      b.sum += r.value;
      b.n++;
      buckets.set(hour, b);
    }
    const means = new Map<number, number>();
    buckets.forEach((b, hour) => means.set(hour, b.sum / b.n));
    hourlyMeans[varCode] = means;
  }

  const correlations: VariableCorrelation[] = [];
  for (let i = 0; i < CONTINUOUS_VARS.length; i++) {
    for (let j = i + 1; j < CONTINUOUS_VARS.length; j++) {
      const a = hourlyMeans[CONTINUOUS_VARS[i]];
      const b = hourlyMeans[CONTINUOUS_VARS[j]];
      if (!a || !b) continue;

      const common: [number, number][] = [];
      a.forEach((valA, hour) => {
        const valB = b.get(hour);
        if (valB !== undefined) common.push([valA, valB]);
      });
      if (common.length < MIN_CORRELATION_BUCKETS) continue;

      const xs = common.map((c) => c[0]);
      const ys = common.map((c) => c[1]);
      const xMean = mean(xs);
      const yMean = mean(ys);
      let num = 0;
      let denX = 0;
      let denY = 0;
      for (let k = 0; k < common.length; k++) {
        num += (xs[k] - xMean) * (ys[k] - yMean);
        denX += (xs[k] - xMean) ** 2;
        denY += (ys[k] - yMean) ** 2;
      }
      const den = Math.sqrt(denX * denY);
      if (den < 1e-9) continue;

      const r = num / den;
      if (Math.abs(r) >= CORRELATION_MIN_ABS_R) {
        correlations.push({ varA: CONTINUOUS_VARS[i], varB: CONTINUOUS_VARS[j], r, n: common.length });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 5);
}

/**
 * Score de contexto (0-100): el disparador del análisis con IA. No es un umbral sobre
 * una variable aislada, sino una medida agregada de cuánto se movió el estado del
 * paciente en el intervalo -- solo cuando el contexto en conjunto cambió lo suficiente
 * se gasta una llamada a la IA.
 */
export function computeContextScore(statsList: VariableStats[]): number {
  let score = 0;
  let deviatedVars = 0;

  for (const s of statsList) {
    let deviated = false;

    if (s.zLatest !== null) {
      const absZ = Math.abs(s.zLatest);
      if (absZ >= 3) {
        score += 25;
        deviated = true;
      } else if (absZ >= 2) {
        score += 15;
        deviated = true;
      }
    }

    if (s.deltaPct !== null && Math.abs(s.deltaPct) >= 15) {
      score += 10;
      deviated = true;
    }

    if (s.clinicalFlag === 'CRITICAL') {
      score += 25;
      deviated = true;
    } else if (s.clinicalFlag === 'WARNING') {
      score += 12;
      deviated = true;
    }

    // Persistencia del episodio: una fracción sostenida de lecturas fuera de rango
    // pesa aunque la media del intervalo (diluida) y el último valor luzcan normales.
    if (s.pctOutOfRange >= 0.3) {
      score += 15;
      deviated = true;
    } else if (s.pctOutOfRange >= 0.1) {
      score += 8;
      deviated = true;
    }

    if (deviated) deviatedVars++;
  }

  // Peligro silencioso multivariable: varias variables desviadas a la vez pesan más
  // que la suma de sus partes.
  if (deviatedVars >= 2) score += 15;

  return Math.min(100, Math.round(score));
}

export type AlertKind = 'VALUE_ANOMALY' | 'DATA_GAP';
export type PriorityTier = 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AnomalyDetection {
  variableCode: string;
  value: number;
  timestamp: string;
  kind: AlertKind;
  priorityTier: PriorityTier;
  priorityScore: number;
  ruleReason: string;
  corroboratingVariables: string[];
}

export interface ThresholdRule {
  label: string;
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export const CLINICAL_THRESHOLDS: Record<string, ThresholdRule> = {
  HR: { label: 'Frecuencia Cardíaca', warningLow: 50, warningHigh: 100, criticalLow: 40, criticalHigh: 140 },
  SYS_BP: { label: 'Presión Sistólica', warningLow: 90, warningHigh: 140, criticalLow: 80, criticalHigh: 180 },
  DIA_BP: { label: 'Presión Diastólica', warningLow: 60, warningHigh: 90, criticalLow: 50, criticalHigh: 110 },
  RESP: { label: 'Frecuencia Respiratoria', warningLow: 12, warningHigh: 20, criticalLow: 8, criticalHigh: 28 },
  SpO2: { label: 'Saturación de Oxígeno', warningLow: 92, criticalLow: 88 },
  TEMP: { label: 'Temperatura', warningLow: 36, warningHigh: 37.8, criticalLow: 35, criticalHigh: 39 },
};

export const CONTINUOUS_VARS = ['HR', 'SpO2', 'TEMP', 'SYS_BP', 'DIA_BP', 'RESP'];

const TREND_WINDOW = 6;
const TREND_MIN_POINTS = 4;
const TREND_Z_SCORE_THRESHOLD = 3.2;

// Piso de desviación absoluta (unidad nativa) que un salto debe superar para siquiera
// candidatear a "tendencia anómala" -- evita que el z-score se dispare con variaciones
// triviales cuando el baseline reciente es casi plano (mismo problema resuelto en
// clean_health_data.py con GLITCH_MIN_ABS_DEVIATION).
export const TREND_MIN_ABS_DEVIATION: Record<string, number> = {
  HR: 15,
  SYS_BP: 15,
  DIA_BP: 10,
  RESP: 4,
  SpO2: 3,
  TEMP: 0.6,
};

const ACTIVITY_CONTEXT_VARS = new Set(['HR', 'RESP']);
const ACTIVITY_ELEVATED_LEVELS = new Set(['MODERATE', 'HIGH']);

// Intervalo esperado de reporte por defecto (minutos) si no hay suficiente histórico
// propio del paciente para estimarlo empíricamente.
const DEFAULT_EXPECTED_INTERVAL_MIN: Record<string, number> = {
  HR: 20,
  SpO2: 20,
  RESP: 20,
  TEMP: 60,
  SYS_BP: 60,
  DIA_BP: 60,
};
const DATA_GAP_MULTIPLIER = 3;

interface BaseSignal {
  triggered: boolean;
  isCritical: boolean;
  reason: string;
}

function checkThreshold(variableCode: string, value: number): BaseSignal {
  const rule = CLINICAL_THRESHOLDS[variableCode];
  if (!rule) return { triggered: false, isCritical: false, reason: '' };

  if (rule.criticalLow !== undefined && value < rule.criticalLow) {
    return { triggered: true, isCritical: true, reason: `${rule.label} crítica: ${value} por debajo del límite crítico (${rule.criticalLow}).` };
  }
  if (rule.criticalHigh !== undefined && value > rule.criticalHigh) {
    return { triggered: true, isCritical: true, reason: `${rule.label} crítica: ${value} supera el límite crítico (${rule.criticalHigh}).` };
  }
  if (rule.warningLow !== undefined && value < rule.warningLow) {
    return { triggered: true, isCritical: false, reason: `${rule.label} fuera de rango normal: ${value} por debajo del umbral (${rule.warningLow}).` };
  }
  if (rule.warningHigh !== undefined && value > rule.warningHigh) {
    return { triggered: true, isCritical: false, reason: `${rule.label} fuera de rango normal: ${value} supera el umbral (${rule.warningHigh}).` };
  }
  return { triggered: false, isCritical: false, reason: '' };
}

function computeTrendZScore(value: number, history: number[]): { zScore: number; mean: number } | null {
  const window = history.slice(-TREND_WINDOW);
  if (window.length < TREND_MIN_POINTS) return null;

  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return null;

  return { zScore: (value - mean) / stdDev, mean };
}

function checkTrend(variableCode: string, value: number, history: number[]): BaseSignal {
  const minAbsDev = TREND_MIN_ABS_DEVIATION[variableCode];
  if (minAbsDev === undefined) return { triggered: false, isCritical: false, reason: '' };

  const trend = computeTrendZScore(value, history);
  if (!trend) return { triggered: false, isCritical: false, reason: '' };

  const absDeviation = Math.abs(value - trend.mean);
  if (Math.abs(trend.zScore) <= TREND_Z_SCORE_THRESHOLD || absDeviation <= minAbsDev) {
    return { triggered: false, isCritical: false, reason: '' };
  }

  const rule = CLINICAL_THRESHOLDS[variableCode];
  const label = rule?.label ?? variableCode;
  return {
    triggered: true,
    isCritical: false,
    reason: `Variación abrupta de ${label} respecto a la línea base reciente (z=${trend.zScore.toFixed(2)}, baseline≈${trend.mean.toFixed(1)}).`,
  };
}

/**
 * Determina si una variable continua tiene, en el punto dado, un candidato propio
 * (umbral o tendencia) activo -- usado por otras variables para el chequeo de
 * corroboración multivariable (Patrón 4), sin generar aquí una alerta.
 */
export function hasOwnCandidate(variableCode: string, value: number, history: number[]): boolean {
  if (isNaN(value)) return false;
  const threshold = checkThreshold(variableCode, value);
  if (threshold.triggered) return true;
  return checkTrend(variableCode, value, history).triggered;
}

export interface EvaluationContext {
  variableCode: string;
  value: number;
  timestamp: string;
  history: number[];
  /** Siguiente lectura ya revelada de esta misma variable/paciente, si existe en el batch actual. */
  nextValue?: number;
  /** Valor de ACTIVITY_LEVEL más cercano en el tiempo a esta lectura, si se pudo resolver. */
  activityLevel?: string;
  /** Códigos de OTRAS variables continuas que en este mismo tick también tienen un candidato propio activo. */
  otherActiveTrends: string[];
}

function scoreToTier(score: number): PriorityTier | null {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  // MEDIUM (40-59) y LOW (<40) se suprimen -- solo lo que llega a HIGH/CRITICAL se
  // convierte en alerta visible. Es el filtro principal contra la fatiga de alertas:
  // la detección sigue corriendo sobre todo, pero solo lo relevante sale a superficie
  // (y solo eso es lo que dispara el análisis contextual de IA, ver Patrón 4 más abajo).
  return null;
}

/**
 * Motor de dos etapas: detección por punto (umbral + tendencia) y priorización
 * aplicando los patrones de gestión de falsas alarmas. Devuelve null si la anomalía
 * no alcanza el piso mínimo de prioridad (se descarta intencionalmente, no es un bug).
 */
export function evaluatePoint(ctx: EvaluationContext): AnomalyDetection | null {
  if (isNaN(ctx.value)) return null;

  const threshold = checkThreshold(ctx.variableCode, ctx.value);
  const trend = !threshold.triggered ? checkTrend(ctx.variableCode, ctx.value, ctx.history) : null;
  const signal = threshold.triggered ? threshold : trend;
  if (!signal || !signal.triggered) return null;

  let score = signal.isCritical ? 70 : threshold.triggered ? 40 : 30;

  // Patrón 1 -- Contexto manda: elevación de HR/RESP explicada por actividad física.
  if (
    ACTIVITY_CONTEXT_VARS.has(ctx.variableCode) &&
    ctx.activityLevel &&
    ACTIVITY_ELEVATED_LEVELS.has(ctx.activityLevel)
  ) {
    score -= 25;
  }

  // Patrón 2 -- Artefacto: si la siguiente lectura ya revelada vuelve a la normalidad,
  // es probable que sea un pico transitorio, salvo que otras variables lo corroboren.
  const corroboratingVariables = ctx.otherActiveTrends.filter((v) => v !== ctx.variableCode);
  if (ctx.nextValue !== undefined) {
    const nextStillTriggered =
      checkThreshold(ctx.variableCode, ctx.nextValue).triggered ||
      checkTrend(ctx.variableCode, ctx.nextValue, [...ctx.history, ctx.value]).triggered;
    if (!nextStillTriggered && corroboratingVariables.length === 0) {
      score -= 25;
    }
  } else if (corroboratingVariables.length === 0) {
    // Aún no se puede confirmar persistencia (es el dato más reciente) -- se capa en
    // MEDIUM salvo que ya haya corroboración multivariable, que es evidencia independiente.
    score = Math.min(score, 55);
  }

  // Patrón 4 -- Peligro silencioso multivariable: co-ocurrencia estadística con otras
  // variables continuas en el mismo tick (sin asumir un síndrome clínico específico).
  if (corroboratingVariables.length > 0) {
    score += Math.min(corroboratingVariables.length * 15, 30);
  }

  let tier = scoreToTier(score);
  if (corroboratingVariables.length >= 2 && (tier === null || tier === 'MEDIUM')) {
    tier = 'HIGH';
  }
  if (!tier) return null; // Patrón 3 implícito: anomalía aislada sin refuerzo se queda en LOW y se suprime.

  return {
    variableCode: ctx.variableCode,
    value: ctx.value,
    timestamp: ctx.timestamp,
    kind: 'VALUE_ANOMALY',
    priorityTier: tier,
    priorityScore: Math.round(score),
    ruleReason: signal.reason,
    corroboratingVariables,
  };
}

/**
 * Patrón 5 -- Trampa del vacío: la ausencia de lecturas no equivale a ausencia de
 * riesgo. Si el intervalo esperado de reporte se supera varias veces, genera una
 * alerta explícita de tipo DATA_GAP en vez de quedar en silencio.
 */
export function detectDataGap(
  variableCode: string,
  timestampsAscending: string[],
  timeTISO: string
): AnomalyDetection | null {
  if (!CONTINUOUS_VARS.includes(variableCode) || timestampsAscending.length === 0) return null;

  const timeTEpoch = new Date(timeTISO).getTime();
  const lastEpoch = new Date(timestampsAscending[timestampsAscending.length - 1]).getTime();
  if (isNaN(timeTEpoch) || isNaN(lastEpoch)) return null;

  let expectedIntervalMin = DEFAULT_EXPECTED_INTERVAL_MIN[variableCode] ?? 30;
  if (timestampsAscending.length >= 5) {
    const recentEpochs = timestampsAscending.slice(-6).map((t) => new Date(t).getTime());
    const gaps: number[] = [];
    for (let i = 1; i < recentEpochs.length; i++) {
      gaps.push((recentEpochs[i] - recentEpochs[i - 1]) / (60 * 1000));
    }
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    if (median > 0) expectedIntervalMin = median;
  }

  const elapsedMin = (timeTEpoch - lastEpoch) / (60 * 1000);
  if (elapsedMin <= expectedIntervalMin * DATA_GAP_MULTIPLIER) return null;

  const rule = CLINICAL_THRESHOLDS[variableCode];
  const label = rule?.label ?? variableCode;

  return {
    variableCode,
    value: NaN,
    timestamp: timeTISO,
    kind: 'DATA_GAP',
    priorityTier: 'MEDIUM',
    priorityScore: 50,
    ruleReason: `Sin lecturas de ${label} en los últimos ${Math.round(elapsedMin)} min (esperado ≈${Math.round(
      expectedIntervalMin
    )} min) — vacío de datos, no implica ausencia de riesgo.`,
    corroboratingVariables: [],
  };
}

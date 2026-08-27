import { VariableStats, VariableCorrelation } from '@/lib/contextStats';
import { CLINICAL_THRESHOLDS } from '@/lib/anomalyRules';
import { VARIABLE_LABELS } from '@/lib/variableMeta';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AIAnomalyItem {
  metric: string;
  label: string;
  change: string;
  isDanger: boolean;
  sparklineData: { val: number }[];
}

export interface ContextualInsight {
  objectiveAnalysis: string;
  keyAnomalies: AIAnomalyItem[];
}

export interface IncrementalDiagnosisRequest {
  patientId: string;
  /** Inicio del intervalo analizado (= timestamp del diagnóstico previo, o inicio de la ventana). */
  windowStartISO: string;
  /** Fin del intervalo analizado (momento simulado actual). */
  windowEndISO: string;
  /** Diagnóstico previo -- memoria comprimida de todo lo anterior al intervalo. */
  previousDiagnosis: string | null;
  stats: VariableStats[];
  correlations: VariableCorrelation[];
  activityLevel?: string;
  contextScore: number;
}

function fmt(n: number | null, digits = 1): string {
  return n === null ? 'n/d' : n.toFixed(digits);
}

/** Decimales apropiados por variable: la temperatura necesita uno, el resto lee mejor entero. */
function clinicalDigits(variableCode: string): number {
  return variableCode === 'TEMP' ? 1 : 0;
}

function val(n: number | null, variableCode: string): string {
  return n === null ? 'n/d' : n.toFixed(clinicalDigits(variableCode));
}

/** Rango de referencia clínico en texto legible, tomado del mismo motor de reglas. */
function referenceRange(variableCode: string, unit: string): string {
  const rule = CLINICAL_THRESHOLDS[variableCode];
  if (!rule) return 'sin rango de referencia definido';

  const d = clinicalDigits(variableCode);
  if (rule.warningLow !== undefined && rule.warningHigh !== undefined) {
    return `normal ${rule.warningLow.toFixed(d)}–${rule.warningHigh.toFixed(d)} ${unit}`;
  }
  if (rule.warningLow !== undefined) {
    return `normal ≥ ${rule.warningLow.toFixed(d)} ${unit}`;
  }
  if (rule.warningHigh !== undefined) {
    return `normal ≤ ${rule.warningHigh.toFixed(d)} ${unit}`;
  }
  return 'sin rango de referencia definido';
}

function trendPhrase(s: VariableStats): string {
  if (s.slopePerHour === null) return '';
  const d = clinicalDigits(s.variableCode);
  const magnitude = Math.abs(s.slopePerHour);
  // Una pendiente que no mueve la aguja en varias horas no merece narrarse como tendencia.
  if (magnitude < Math.pow(10, -d) / 2) return 'sin tendencia definida';
  const direction = s.slopePerHour > 0 ? 'en ascenso' : 'en descenso';
  return `${direction} a ${magnitude.toFixed(Math.max(d, 1))} ${s.unit}/h`;
}

/**
 * Presenta la evidencia como la leería un clínico: valor actual y rango de referencia
 * primero, luego la evolución en unidades nativas, y el sustento estadístico al final
 * entre paréntesis. El orden importa -- cuando el bloque era notación estadística cruda,
 * el modelo respondía en ese mismo registro.
 */
function buildClinicalEvidence(stats: VariableStats[]): string {
  return stats
    .map((s) => {
      const label = VARIABLE_LABELS[s.variableCode] || s.label;
      const d = clinicalDigits(s.variableCode);

      const header = `- ${label}: ${val(s.last, s.variableCode)} ${s.unit} (${referenceRange(
        s.variableCode,
        s.unit
      )})${s.clinicalFlag !== 'NONE' ? ` — FUERA DE RANGO (${s.clinicalFlag === 'CRITICAL' ? 'crítico' : 'advertencia'})` : ''}`;

      const evolution: string[] = [];
      evolution.push(
        `pasó de ${val(s.first, s.variableCode)} a ${val(s.last, s.variableCode)} ${s.unit} en el intervalo (mín ${val(
          s.min,
          s.variableCode
        )}, máx ${val(s.max, s.variableCode)}, ${s.nInterval} lecturas)`
      );
      if (s.baselineMean !== null) {
        evolution.push(`basal previa ${val(s.baselineMean, s.variableCode)} ${s.unit}`);
      }
      const trend = trendPhrase(s);
      if (trend) evolution.push(trend);
      if (s.pctOutOfRange > 0) {
        evolution.push(`${(s.pctOutOfRange * 100).toFixed(0)}% de las lecturas fuera del rango normal`);
      }

      const support: string[] = [];
      if (s.deltaPct !== null) {
        support.push(`Δ vs. basal ${s.deltaPct >= 0 ? '+' : ''}${fmt(s.deltaPct)}%`);
      }
      if (s.zLatest !== null) support.push(`z=${fmt(s.zLatest, 2)}`);
      support.push(`DE intervalo ${s.intervalStd.toFixed(Math.max(d, 1))} ${s.unit}`);

      return `${header}\n    Evolución: ${evolution.join('; ')}.\n    Sustento estadístico: ${support.join(', ')}.`;
    })
    .join('\n');
}

/** Traduce un coeficiente de Pearson a la fuerza de asociación en lenguaje corriente. */
function correlationStrength(r: number): string {
  const abs = Math.abs(r);
  const direction = r > 0 ? 'en el mismo sentido' : 'en sentido opuesto';
  if (abs >= 0.8) return `se mueven de forma muy consistente ${direction}`;
  if (abs >= 0.65) return `se mueven de forma consistente ${direction}`;
  return `muestran una asociación moderada ${direction}`;
}

function intervalHours(startISO: string, endISO: string): number {
  const diff = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.max(0, Math.round(diff / (60 * 60 * 1000)));
}

function buildPrompt(req: IncrementalDiagnosisRequest): string {
  const corrBlock =
    req.correlations.length > 0
      ? req.correlations
          .map((c) => {
            const labelA = VARIABLE_LABELS[c.varA] || c.varA;
            const labelB = VARIABLE_LABELS[c.varB] || c.varB;
            return `- ${labelA} y ${labelB} ${correlationStrength(c.r)} (r=${c.r.toFixed(2)}, ${c.n} h comparadas).`;
          })
          .join('\n')
      : '- No se detectó asociación relevante entre variables en este intervalo: las desviaciones se comportan de forma independiente.';

  const hours = intervalHours(req.windowStartISO, req.windowEndISO);
  const flagged = req.stats.filter((s) => s.clinicalFlag !== 'NONE').length;

  return `Eres un asistente de monitorización clínica que redacta notas de evolución para el MÉDICO TRATANTE que revisa la telemetría del paciente. No emites diagnóstico médico ni indicaciones terapéuticas: aportas lectura clínica de los datos para orientar su criterio.

PACIENTE ${req.patientId}. Ventana de monitorización: últimas ${hours} h de tiempo simulado (${req.windowStartISO} → ${req.windowEndISO}).
${req.activityLevel ? `Estado de actividad predominante: ${req.activityLevel}. Considéralo al interpretar frecuencia cardíaca y respiratoria.` : ''}
Variables actualmente fuera de rango de referencia: ${flagged} de ${req.stats.length}.

${req.previousDiagnosis ? `NOTA PREVIA (resume toda la evolución anterior a esta ventana; tu nota debe continuarla, no repetirla):\n"${req.previousDiagnosis}"` : 'Primera valoración de este paciente: no hay nota previa con la cual comparar.'}

PARÁMETROS MONITORIZADOS EN LA VENTANA:
${buildClinicalEvidence(req.stats)}

COMPORTAMIENTO CONJUNTO DE LOS PARÁMETROS:
${corrBlock}

Redacta la nota (4 a 6 frases, en español, dirigida a un médico) siguiendo este orden:
1. ESTADO ACTUAL: describe la situación del paciente en términos clínicos y fisiológicos, nombrando los parámetros por su nombre clínico y sus valores en unidades reales (mmHg, lpm, °C, %, rpm). Empieza por lo que está alterado; si todo está en rango, dilo directamente.
2. EVOLUCIÓN: ${req.previousDiagnosis ? 'compara con la nota previa e indica si el cuadro mejora, se deteriora o se mantiene estable, y en qué parámetros concretamente.' : 'establece el patrón basal observado en esta primera ventana.'}
3. LECTURA CONJUNTA: interpreta fisiológicamente lo que significa que ciertos parámetros se muevan juntos (o que las alteraciones estén aisladas). Distingue una desviación puntual de una tendencia sostenida.
4. RELEVANCIA CLÍNICA: concluye si el conjunto amerita revisión, y señala qué parámetro conviene vigilar de cerca en las próximas horas.

REGLAS DE REDACCIÓN:
- Escribe como una nota de evolución, en prosa continua y fluida. Nada de listas ni encabezados dentro del texto.
- Prioriza el valor clínico con su unidad ("presión diastólica de 68 mmHg, en descenso desde 78"). El respaldo estadístico (Δ%, z, r) va SOLO entre paréntesis y como refuerzo puntual, nunca como sujeto de la frase. No escribas frases cuyo tema principal sea un estadístico.
- Usa terminología clínica corriente (taquicardia, bradipnea, hipotensión, desaturación, febrícula, normotenso) cuando el dato la justifique, pero sin etiquetar un síndrome ni una enfermedad.
- No inventes valores, parámetros ni hallazgos que no estén en la evidencia anterior. Si un dato no está, no lo menciones.
- No sugieras tratamientos, fármacos, estudios ni dosis. No repitas advertencias sobre tus limitaciones.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta forma exacta:
{
  "objectiveAnalysis": "string",
  "keyAnomalies": [
    { "metric": "CODE", "isDanger": true|false }
  ]
}
"keyAnomalies" debe incluir una entrada por CADA parámetro listado arriba (usando su código: ${req.stats
    .map((s) => s.variableCode)
    .join(', ')}), con "isDanger" = true solo si ese parámetro contribuye a la señal de riesgo clínico.`;
}

/**
 * Diagnóstico incremental: la IA recibe SOLO el contexto comprimido (estadísticas del
 * intervalo + diagnóstico previo como memoria), nunca datos crudos. El "change" y los
 * sparklines de keyAnomalies se rellenan aquí desde las estadísticas locales para
 * garantizar que los números mostrados son exactos, no generados por el modelo.
 */
export async function generateIncrementalDiagnosis(req: IncrementalDiagnosisRequest): Promise<ContextualInsight> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en el entorno del servidor.');
  }

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(req) }] }],
      generationConfig: {
        temperature: 0.3,
        // La nota clínica pide 4-6 frases (antes 3-5) y algo más de desarrollo, así que
        // el presupuesto sube para que no se corte a mitad de la última frase.
        maxOutputTokens: 900,
        responseMimeType: 'application/json',
        // gemini-2.5-flash tiene "thinking" activado por defecto, que consume el mismo
        // presupuesto de tokens que la respuesta visible -- sin desactivarlo, una tarea
        // de salida corta como esta puede agotar maxOutputTokens solo en razonamiento
        // interno y devolver texto vacío (finishReason: MAX_TOKENS).
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Gemini API respondió ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini API no devolvió texto utilizable.');
  }

  let parsed: { objectiveAnalysis: string; keyAnomalies: { metric: string; isDanger: boolean }[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini API no devolvió un JSON válido.');
  }

  const dangerByMetric = new Map<string, boolean>();
  (parsed.keyAnomalies || []).forEach((k) => dangerByMetric.set(k.metric, !!k.isDanger));

  // Los números mostrados salen de las estadísticas locales (exactos), la IA solo
  // aporta el juicio de qué variables son señal de riesgo y el análisis redactado.
  const keyAnomalies: AIAnomalyItem[] = req.stats.map((s) => ({
    metric: s.variableCode,
    label: `${s.label} (${s.variableCode})`,
    change:
      s.deltaPct !== null ? `${s.deltaPct >= 0 ? '+' : ''}${s.deltaPct.toFixed(1)}%` : 's/d',
    isDanger: dangerByMetric.get(s.variableCode) ?? s.clinicalFlag !== 'NONE',
    sparklineData: s.recentValues.map((val) => ({ val })),
  }));

  return { objectiveAnalysis: parsed.objectiveAnalysis, keyAnomalies };
}

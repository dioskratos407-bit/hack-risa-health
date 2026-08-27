/**
 * Validación de entrada para los endpoints. Los handlers reciben parámetros desde la
 * URL y el body sin ninguna garantía de forma: sin esto, texto arbitrario llegaba a los
 * filtros de PostgREST, se escribía en la base y (vía la nota previa) terminaba dentro
 * del prompt del modelo.
 *
 * Todo lo que no encaja se rechaza aquí, antes de tocar la base o el LLM.
 */

import { CONTINUOUS_VARS } from '@/lib/anomalyRules';
import { getAllVariables } from '@/lib/clinicalClusters';

export class ValidationError extends Error {}

/** Los IDs del dataset del reto tienen forma PAT-0001. Nada más es aceptable. */
const PATIENT_ID_PATTERN = /^PAT-\d{4}$/;

const ALLOWED_VARIABLE_CODES = new Set([...getAllVariables(), ...CONTINUOUS_VARS]);
const ALLOWED_TIERS = new Set(['MEDIUM', 'HIGH', 'CRITICAL']);
const ALLOWED_KINDS = new Set(['VALUE_ANOMALY', 'DATA_GAP']);

/** Límite de texto libre persistido, para acotar el abuso de almacenamiento. */
const MAX_REASON_LENGTH = 500;

export function validatePatientId(raw: unknown): string {
  if (typeof raw !== 'string' || !PATIENT_ID_PATTERN.test(raw)) {
    throw new ValidationError('patientId inválido: se espera el formato PAT-0000.');
  }
  return raw;
}

/**
 * Normaliza un instante a ISO. Devolver la forma canónica (y no la cadena original)
 * evita que texto arbitrario llegue a los filtros de la consulta.
 */
export function validateTimestamp(raw: unknown, field = 'timestamp'): string {
  if (typeof raw !== 'string' || raw.length > 40) {
    throw new ValidationError(`${field} inválido: se espera una fecha ISO 8601.`);
  }
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) {
    throw new ValidationError(`${field} inválido: se espera una fecha ISO 8601.`);
  }
  return parsed.toISOString();
}

export function validateVariableCode(raw: unknown): string {
  if (typeof raw !== 'string' || !ALLOWED_VARIABLE_CODES.has(raw)) {
    throw new ValidationError(
      'variableCode inválido: no corresponde a una variable monitorizada.'
    );
  }
  return raw;
}

export function validateCluster(raw: unknown): string {
  if (typeof raw !== 'string' || !/^[A-Za-z_]{1,32}$/.test(raw)) {
    throw new ValidationError('cluster inválido.');
  }
  return raw;
}

export function validatePriorityTier(raw: unknown): 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (typeof raw !== 'string' || !ALLOWED_TIERS.has(raw)) {
    throw new ValidationError('priorityTier inválido: debe ser MEDIUM, HIGH o CRITICAL.');
  }
  return raw as 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function validateAlertKind(raw: unknown): 'VALUE_ANOMALY' | 'DATA_GAP' {
  if (typeof raw !== 'string' || !ALLOWED_KINDS.has(raw)) {
    throw new ValidationError('kind inválido: debe ser VALUE_ANOMALY o DATA_GAP.');
  }
  return raw as 'VALUE_ANOMALY' | 'DATA_GAP';
}

export function validateScore(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new ValidationError('priorityScore inválido: debe ser un número entre 0 y 100.');
  }
  return n;
}

/** Valor de medición: finito y en un rango físicamente posible. null es válido (DATA_GAP). */
export function validateMeasurement(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(n) || n < -1000 || n > 10000) {
    throw new ValidationError('value inválido: debe ser un número finito en rango plausible.');
  }
  return n;
}

/**
 * Quita caracteres de control (incluidos saltos de línea y DEL) comparando por código,
 * en vez de con un literal de regex: los literales de control no sobreviven a las
 * herramientas de edición y quedaban silenciosamente corruptos.
 */
function stripControlChars(input: string): string {
  let out = '';
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    out += code < 0x20 || code === 0x7f ? ' ' : char;
  }
  return out;
}

/**
 * Texto libre que se persiste y luego se muestra. React escapa al renderizar, así que
 * el riesgo no es XSS sino almacenamiento abusivo y contaminación del contexto del LLM:
 * se le quitan los caracteres de control, se colapsan espacios y se recorta.
 */
export function sanitizeFreeText(raw: unknown, field = 'texto'): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new ValidationError(`${field} inválido: se espera texto no vacío.`);
  }
  const cleaned = stripControlChars(raw).replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) {
    throw new ValidationError(`${field} inválido: se espera texto no vacío.`);
  }
  return cleaned.slice(0, MAX_REASON_LENGTH);
}

/**
 * Neutraliza texto de origen no confiable antes de incrustarlo en un prompt: quita
 * control chars, colapsa espacios, elimina delimitadores que podrían cerrar el bloque
 * de datos y acota la longitud. No sustituye a la instrucción del prompt que le dice al
 * modelo que trate el bloque como dato, pero elimina el vector más directo.
 */
export function sanitizeForPrompt(raw: string, maxLength = 1200): string {
  const cleaned = stripControlChars(raw)
    .replace(/[`<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}…` : cleaned;
}

/** Lote de pacientes del motor de simulación: acota el tamaño y valida cada elemento. */
export function validatePatientBatch(
  raw: unknown,
  maxSize: number
): { id: string; cursor?: string }[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ValidationError(
      'patients inválido: se espera un arreglo no vacío de { id, cursor? }.'
    );
  }
  if (raw.length > maxSize) {
    throw new ValidationError(`patients excede el máximo de ${maxSize} por petición.`);
  }
  return raw.map((entry) => {
    const item = entry as { id?: unknown; cursor?: unknown };
    const id = validatePatientId(item?.id);
    const cursor =
      item?.cursor === undefined || item?.cursor === null
        ? undefined
        : validateTimestamp(item.cursor, 'cursor');
    return { id, cursor };
  });
}

export type TimeFilterRange =
  | '1H'
  | '2H'
  | '5H'
  | '10H'
  | '1D'
  | '2D'
  | '3D'
  | '5D'
  | '1W'
  | '2W'
  | '1M'
  | '1A'
  | '5A'
  | 'MAX';

export interface DataPoint {
  timestamp: string;
  value: number | string;
  variable_code?: string;
  [key: string]: any;
}

export const FILTER_OPTIONS: { label: string; value: TimeFilterRange; description: string }[] = [
  { label: 'Última hora', value: '1H', description: '1 hora atrás' },
  { label: '2 horas', value: '2H', description: '2 horas atrás' },
  { label: '5 horas', value: '5H', description: '5 horas atrás' },
  { label: '10 horas', value: '10H', description: '10 horas atrás' },
  { label: '24 horas', value: '1D', description: '24 horas (1 día)' },
  { label: '2 días', value: '2D', description: '2 días atrás' },
  { label: '3 días', value: '3D', description: '3 días atrás' },
  { label: '5 días', value: '5D', description: '5 días atrás' },
  { label: '1 semana', value: '1W', description: '7 días atrás' },
  { label: '2 semanas', value: '2W', description: '14 días atrás' },
  { label: '1 mes', value: '1M', description: '30 días atrás' },
  { label: '1 año', value: '1A', description: '365 días atrás' },
  { label: '5 años', value: '5A', description: '5 años atrás' },
  { label: 'Máximo', value: 'MAX', description: 'Todo el historial registrado' },
];

/**
 * Filtra los datos históricamente respecto a timeT y aplica el algoritmo de downsampling (buckets)
 */
export function downsampleData(
  rawData: DataPoint[],
  filterRange: TimeFilterRange,
  timeTISO: string
): DataPoint[] {
  if (!rawData || rawData.length === 0) return [];

  const timeTEpoch = new Date(timeTISO).getTime();
  if (isNaN(timeTEpoch)) return rawData;

  // 1. Cálculo de cota inferior desde timeT
  let minEpoch = 0;
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;

  switch (filterRange) {
    case '1H':
      minEpoch = timeTEpoch - 1 * HOUR_MS;
      break;
    case '2H':
      minEpoch = timeTEpoch - 2 * HOUR_MS;
      break;
    case '5H':
      minEpoch = timeTEpoch - 5 * HOUR_MS;
      break;
    case '10H':
      minEpoch = timeTEpoch - 10 * HOUR_MS;
      break;
    case '1D':
      minEpoch = timeTEpoch - 1 * DAY_MS;
      break;
    case '2D':
      minEpoch = timeTEpoch - 2 * DAY_MS;
      break;
    case '3D':
      minEpoch = timeTEpoch - 3 * DAY_MS;
      break;
    case '5D':
      minEpoch = timeTEpoch - 5 * DAY_MS;
      break;
    case '1W':
      minEpoch = timeTEpoch - 7 * DAY_MS;
      break;
    case '2W':
      minEpoch = timeTEpoch - 14 * DAY_MS;
      break;
    case '1M':
      minEpoch = timeTEpoch - 30 * DAY_MS;
      break;
    case '1A':
      minEpoch = timeTEpoch - 365 * DAY_MS;
      break;
    case '5A':
      minEpoch = timeTEpoch - 5 * 365 * DAY_MS;
      break;
    case 'MAX':
    default:
      minEpoch = 0;
      break;
  }

  // Filtrado temporal: minEpoch <= timestamp <= timeTEpoch
  const filtered = rawData.filter((item) => {
    const epoch = new Date(item.timestamp).getTime();
    return epoch >= minEpoch && epoch <= timeTEpoch;
  });

  if (filtered.length === 0) return [];

  // 2. Definición del tamaño de la cubeta (bucketMs)
  let bucketMs = 0;
  switch (filterRange) {
    case '1H':
      bucketMs = 2 * 60 * 1000; // 2 minutos
      break;
    case '2H':
      bucketMs = 5 * 60 * 1000; // 5 minutos
      break;
    case '5H':
      bucketMs = 15 * 60 * 1000; // 15 minutos
      break;
    case '10H':
      bucketMs = 30 * 60 * 1000; // 30 minutos
      break;
    case '1D':
      bucketMs = 1 * HOUR_MS; // 1 hora
      break;
    case '2D':
      bucketMs = 2 * HOUR_MS; // 2 horas
      break;
    case '3D':
      bucketMs = 3 * HOUR_MS; // 3 horas
      break;
    case '5D':
      bucketMs = 6 * HOUR_MS; // 6 horas
      break;
    case '1W':
      bucketMs = 12 * HOUR_MS; // 12 horas
      break;
    case '2W':
    case '1M':
      bucketMs = 1 * DAY_MS; // 1 día
      break;
    case '1A':
      bucketMs = 7 * DAY_MS; // 1 semana
      break;
    case '5A':
    case 'MAX':
      bucketMs = 30 * DAY_MS; // 1 mes
      break;
  }

  // Si los datos filtrados son muy pocos, mantener exactos
  if (filtered.length <= 40) {
    return filtered
      .map((item) => ({
        ...item,
        value: typeof item.value === 'number' ? item.value : parseFloat(item.value as string),
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Agrupación en cubetas (Time Buckets Aggregation)
  const buckets = new Map<number, DataPoint[]>();

  filtered.forEach((item) => {
    const epoch = new Date(item.timestamp).getTime();
    const bucketKey = Math.floor(epoch / bucketMs) * bucketMs;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(item);
  });

  // Promediar valores numéricos
  const result: DataPoint[] = [];

  buckets.forEach((items, bucketKey) => {
    const numericValues = items
      .map((i) => (typeof i.value === 'number' ? i.value : parseFloat(i.value as string)))
      .filter((v) => !isNaN(v));

    const avgVal =
      numericValues.length > 0
        ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        : 0;

    const bucketTimestamp = new Date(bucketKey + bucketMs / 2).toISOString();

    result.push({
      ...items[0],
      timestamp: bucketTimestamp,
      value: Math.round(avgVal * 100) / 100,
    });
  });

  return result.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Formatea fechas para el eje X ESTRICTAMENTE EN UTC (igual que la base de datos Supabase)
 */
export function formatFinancialDate(isoString: string, filterRange: TimeFilterRange): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    if (['1H', '2H', '5H', '10H', '1D'].includes(filterRange)) {
      // Ej: 9:40 a. m. (formateado en UTC)
      return d.toLocaleTimeString('es-ES', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });
    }

    if (['2D', '3D', '5D', '1W', '2W', '1M'].includes(filterRange)) {
      // Ej: 25 ago. (formateado en UTC)
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });
    }

    // 1A, 5A, MAX -> Ej: jul. 2026 (formateado en UTC)
    return d.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formatea la fecha completa para el Tooltip Flotante ESTRICTAMENTE EN UTC (ej: "jue, 27 ago 9:40 a.m.")
 */
export function formatFullTooltipDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' });
    const dayMonth = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const timeStr = d.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });

    return `${weekday}, ${dayMonth} ${timeStr} UTC`;
  } catch {
    return isoString;
  }
}

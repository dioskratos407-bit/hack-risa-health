/**
 * Limitador de tasa en memoria para los endpoints que cuestan dinero (llamadas al LLM)
 * o escrituras en la base. Es deliberadamente simple y local al proceso: no hay Redis
 * ni almacenamiento compartido en este prototipo, así que con varias instancias el
 * límite aplica por instancia. Sirve para lo que se necesita aquí -- impedir que un
 * bucle accidental o una petición repetida agote la cuota de la API -- y no pretende
 * ser un control distribuido.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Evita que el Map crezca sin límite en un proceso de larga vida. */
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [k, b] of buckets) {
        if (now >= b.resetAt) buckets.delete(k);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Identifica al peticionario para el conteo. Detrás de un proxy la IP real llega en
 * x-forwarded-for; si no hay ninguna cabecera utilizable se usa una clave común, lo que
 * hace el límite global en vez de por cliente (más restrictivo, nunca menos).
 */
export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

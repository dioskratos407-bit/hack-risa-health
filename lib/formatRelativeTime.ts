/**
 * Formatea un timestamp ISO como tiempo relativo ("Hace 2 min") para intervalos cortos,
 * y como fecha absoluta legible para todo lo demás -- evita mostrar "Hace 46 días" cuando
 * una fecha exacta comunica mejor la información.
 */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return iso;

  const diffMs = Date.now() - then;
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 0) return formatAbsolute(iso);
  if (diffSec < 60) return 'Hace instantes';
  if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 172800) return 'Ayer';

  return formatAbsolute(iso);
}

export function formatAbsolute(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

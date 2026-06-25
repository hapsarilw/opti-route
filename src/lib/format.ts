/** Presentation formatters — kept pure & dependency-free for easy unit testing. */

/** "1,240 kg" */
export function formatWeight(kg: number): string {
  return `${kg.toLocaleString('en-US')} kg`;
}

/** Minutes -> "3h 42m" (or "42m"). */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** "-8.6500, 115.2167" */
export function formatCoordinate(lat: number, lng: number, digits = 4): string {
  return `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`;
}

/** ISO8601 -> "24 Jun 2026, 14:32". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

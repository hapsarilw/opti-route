import type { Coordinate, Manifest, Priority } from '@/types';
import { haversineKm } from '@/lib/haversine';

/**
 * Pure view-model helpers for the optimize result drawer (Process 2 §2.3).
 * Derives the numbered timeline + summary metrics from the AI response. The ETA
 * model mirrors the mock optimizer (avg speed + per-stop service time) so the
 * per-stop deltas stay consistent with the total returned by the engine.
 */
const AVG_SPEED_KMH = 30;
const SERVICE_MINS_PER_STOP = 8;

export interface TimelineStop {
  seq: number;
  manifestId: string;
  recipient: string;
  region: string;
  priority: Priority;
  /** "Start" for the first stop, otherwise a cumulative "+N min" delta. */
  eta: string;
  note: string;
  isFirst: boolean;
  isLast: boolean;
}

function noteFor(index: number, total: number, region: string): string {
  if (index === 0) return 'Start point · nearest warehouse';
  if (index === total - 1) return `Final stop · ${region}`;
  return `Along the route · ${region}`;
}

/**
 * Build the optimal-sequence timeline. `waypoints[0]` is the warehouse origin and
 * `waypoints[i + 1]` is the i-th stop, so the leg into stop i runs
 * `waypoints[i] → waypoints[i + 1]`.
 */
export function buildTimeline(
  optimizedSequence: string[],
  waypoints: Coordinate[],
  manifestById: Map<string, Manifest>,
): TimelineStop[] {
  let cumulativeMins = 0;
  return optimizedSequence.map((id, i) => {
    if (i > 0) {
      const legKm = haversineKm(waypoints[i], waypoints[i + 1]);
      cumulativeMins += (legKm / AVG_SPEED_KMH) * 60 + SERVICE_MINS_PER_STOP;
    }
    const m = manifestById.get(id);
    const region = m?.region ?? '—';
    return {
      seq: i + 1,
      manifestId: id,
      recipient: m?.recipient_name ?? 'Unknown recipient',
      region,
      priority: m?.priority ?? 'NORMAL',
      eta: i === 0 ? 'Start' : `+${Math.round(cumulativeMins)} min`,
      note: noteFor(i, optimizedSequence.length, region),
      isFirst: i === 0,
      isLast: i === optimizedSequence.length - 1,
    };
  });
}

/** Total polyline distance (km) across all waypoints. */
export function routeDistanceKm(waypoints: Coordinate[]): number {
  let km = 0;
  for (let i = 1; i < waypoints.length; i++) km += haversineKm(waypoints[i - 1], waypoints[i]);
  return km;
}

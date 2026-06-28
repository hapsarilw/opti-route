import type { Coordinate, OptimizeDestination, OptimizeRequest, OptimizeResponse } from '@/types';
import { haversineKm } from '@/lib/haversine';

/**
 * Deterministic route optimizer — Process 2 (Doc 01 §5.2).
 *
 * This is the always-ready fallback for the AI optimizer in the
 * `/api/v1/route/optimize` route handler (SDD §14): if the LLM is unavailable,
 * returns invalid JSON, or proposes an out-of-selection manifest, we fall back
 * here so the dispatcher always gets a usable route.
 *
 * Heuristic: HIGH-priority stops are sequenced first via nearest-neighbour from
 * the warehouse origin, then the remaining NORMAL/LOW stops continue
 * nearest-neighbour from the last HIGH point. Output matches the Doc 01 §5.2
 * schema exactly, so it is interchangeable with the AI response.
 *
 * Pure: no side effects. The caller owns persistence (e.g. routeManifestMap).
 */

const AVG_SPEED_KMH = 30; // realistic Bali urban/rural average
const SERVICE_MINS_PER_STOP = 8; // unloading + paperwork per drop-off

const asCoord = (d: OptimizeDestination): Coordinate => ({ lat: d.lat, lng: d.lng });

/**
 * Greedy nearest-neighbour ordering over `pool`, starting from `from`.
 * Returns the visit order and the final point reached (to chain segments).
 */
function nearestNeighbour(
  from: Coordinate,
  pool: OptimizeDestination[],
): { order: OptimizeDestination[]; last: Coordinate } {
  const remaining = [...pool];
  const order: OptimizeDestination[] = [];
  let cursor = from;

  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(cursor, asCoord(remaining[i]));
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [next] = remaining.splice(bestIdx, 1);
    order.push(next);
    cursor = asCoord(next);
  }

  return { order, last: cursor };
}

/** A fresh mock route id like "rt_8841". */
export function generateRouteId(): string {
  return `rt_${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Total payload weight (kg) a route must carry — the sum of every destination's
 * load. Used to validate that the chosen fleet's `capacity_kg` is sufficient
 * before a route is optimized/dispatched (Doc 01 §2.2).
 */
export function routeLoadKg(destinations: Pick<OptimizeDestination, 'weight_kg'>[]): number {
  return destinations.reduce((sum, d) => sum + (d.weight_kg ?? 0), 0);
}

/**
 * Derive the map geometry for a visit order: the polyline waypoints (origin
 * first, then each stop) and the estimated total duration. This is deterministic
 * given the sequence, so it is computed server-side rather than trusted from an
 * LLM — small models routinely mangle waypoint alignment and duration math.
 */
export function routeGeometry(
  origin: Coordinate,
  ordered: OptimizeDestination[],
): { waypoints: Coordinate[]; distanceKm: number; estimated_total_duration_mins: number } {
  const waypoints: Coordinate[] = [origin, ...ordered.map(asCoord)];

  let distanceKm = 0;
  for (let i = 1; i < waypoints.length; i++) {
    distanceKm += haversineKm(waypoints[i - 1], waypoints[i]);
  }
  const estimated_total_duration_mins = Math.round(
    (distanceKm / AVG_SPEED_KMH) * 60 + ordered.length * SERVICE_MINS_PER_STOP,
  );

  return { waypoints, distanceKm, estimated_total_duration_mins };
}

/** Run the deterministic optimizer over a request, returning a Doc 01 §5.2 response. */
export function runMockOptimize(payload: OptimizeRequest): OptimizeResponse {
  const { origin_coordinate, destinations } = payload;

  const high = destinations.filter((d) => d.priority === 'HIGH');
  const rest = destinations.filter((d) => d.priority !== 'HIGH');

  const highLeg = nearestNeighbour(origin_coordinate, high);
  const restLeg = nearestNeighbour(highLeg.last, rest);
  const ordered = [...highLeg.order, ...restLeg.order];

  const { waypoints, distanceKm, estimated_total_duration_mins } = routeGeometry(
    origin_coordinate,
    ordered,
  );

  const optimized_sequence = ordered.map((d) => d.manifest_id);

  const ai_insights = buildInsights({
    highCount: high.length,
    totalStops: ordered.length,
    distanceKm,
    durationMins: estimated_total_duration_mins,
    firstStop: optimized_sequence[0],
  });

  return {
    status: 'success',
    route_id: generateRouteId(),
    optimized_sequence,
    waypoints,
    estimated_total_duration_mins,
    ai_insights,
  };
}

function buildInsights(args: {
  highCount: number;
  totalStops: number;
  distanceKm: number;
  durationMins: number;
  firstStop: string;
}): string {
  const { highCount, totalStops, distanceKm, durationMins, firstStop } = args;
  const km = distanceKm.toFixed(1);
  const lead = highCount
    ? `Sequenced ${highCount} HIGH-priority ${highCount === 1 ? 'manifest' : 'manifests'} first — starting with ${firstStop} — to clear time-sensitive drop-offs before the warehouse cut-off.`
    : `No HIGH-priority manifests in this batch, so stops were ordered purely by proximity starting with ${firstStop}.`;
  return `${lead} The remaining ${totalStops - highCount} stop${totalStops - highCount === 1 ? '' : 's'} were chained by nearest-neighbour to minimise backtracking, yielding a ${km} km route (~${durationMins} min including ${totalStops} service stops).`;
}

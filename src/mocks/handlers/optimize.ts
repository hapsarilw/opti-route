import { http, HttpResponse } from 'msw';
import type { Coordinate, OptimizeDestination, OptimizeRequest, OptimizeResponse } from '@/types';
import { haversineKm } from '@/lib/haversine';
import { routeManifestMap } from '../data';

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

/**
 * POST /api/v1/route/optimize — Process 2 (Doc 01 §5.2).
 *
 * MOCK optimizer (no LLM yet): HIGH-priority stops are sequenced first via
 * nearest-neighbour from the warehouse origin, then the remaining NORMAL/LOW
 * stops continue nearest-neighbour from the last HIGH point. Response matches
 * the Doc 01 §5.2 schema exactly so the real LLM can be dropped in later.
 */
export const optimizeHandler = http.post('/api/v1/route/optimize', async ({ request }) => {
  const payload = (await request.json()) as OptimizeRequest;
  const { origin_coordinate, destinations } = payload;

  if (!destinations?.length) {
    const empty: OptimizeResponse = {
      status: 'error',
      route_id: '',
      optimized_sequence: [],
      waypoints: [origin_coordinate],
      estimated_total_duration_mins: 0,
      ai_insights: 'No destinations supplied — nothing to optimize.',
    };
    return HttpResponse.json(empty, { status: 400 });
  }

  const high = destinations.filter((d) => d.priority === 'HIGH');
  const rest = destinations.filter((d) => d.priority !== 'HIGH');

  const highLeg = nearestNeighbour(origin_coordinate, high);
  const restLeg = nearestNeighbour(highLeg.last, rest);
  const ordered = [...highLeg.order, ...restLeg.order];

  // Waypoints: origin first, then each stop in visit order (for the map polyline).
  const waypoints: Coordinate[] = [origin_coordinate, ...ordered.map(asCoord)];

  // Estimated duration: travel time across all legs + fixed service time per stop.
  let distanceKm = 0;
  for (let i = 1; i < waypoints.length; i++) {
    distanceKm += haversineKm(waypoints[i - 1], waypoints[i]);
  }
  const estimated_total_duration_mins = Math.round(
    (distanceKm / AVG_SPEED_KMH) * 60 + ordered.length * SERVICE_MINS_PER_STOP,
  );

  const optimized_sequence = ordered.map((d) => d.manifest_id);
  const route_id = `rt_${Math.floor(1000 + Math.random() * 9000)}`;

  const ai_insights = buildInsights({
    highCount: high.length,
    totalStops: ordered.length,
    distanceKm,
    durationMins: estimated_total_duration_mins,
    firstStop: optimized_sequence[0],
  });

  // Store manifest IDs so the dispatch handler can update them in-memory.
  routeManifestMap.set(route_id, optimized_sequence);

  const body: OptimizeResponse = {
    status: 'success',
    route_id,
    optimized_sequence,
    waypoints,
    estimated_total_duration_mins,
    ai_insights,
  };
  return HttpResponse.json(body);
});

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

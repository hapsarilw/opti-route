import type {
  ActiveFleetResponse,
  ActiveRoute,
  Coordinate,
  MonitoredFleet,
  MonitorStatus,
  Route,
  TelemetryPing,
} from '@/types';
import { WAREHOUSE_ORIGIN } from '@/config/constants';
import { haversineKm } from '@/lib/haversine';
import { DRIVERS, FLEET, MANIFESTS, LAND_CENTROIDS } from './data';

/**
 * Live fleet simulation for Process 4 (Doc 02 §4).
 *
 * Holds a module-level roster of vehicles around Bali and advances their
 * positions on every telemetry poll — emulating a GPS feed. Each tick nudges
 * position along the current heading, jitters speed/heading, and occasionally
 * flips a vehicle off-route (→ EXCEPTION) or recovers it (Doc 01 §3). Positions
 * stay inside a south-Bali bounding box.
 *
 * The roster (driver, manifest, base status, ETA) is "static" server state; the
 * moving bits (position/speed/heading/is_off_route) are what telemetry streams.
 */

const TICK_MS = 2_000; // matches the client refetchInterval
const DT_HOURS = TICK_MS / 3_600_000;
const KM_PER_DEG_LAT = 111;

// Time compression for the dispatched vehicle so a route visibly completes in
// ~30–90s of wall-clock instead of the real ~20–30 min. Demo-only knob.
const SIM_SPEEDUP = 25;
// How close (km) counts as "arrived" at a waypoint.
const ARRIVE_EPS_KM = 0.05;

// South-Bali operating area (negative latitudes — real Mapbox coordinates).
const BBOX = { minLat: -8.82, maxLat: -8.5, minLng: 115.05, maxLng: 115.36 };

const SPEED_RANGE: Record<MonitorStatus, [number, number]> = {
  IN_TRANSIT: [38, 78],
  DELAYED: [6, 16],
  DISPATCHED: [30, 55],
  EXCEPTION: [0, 0], // never a base status; here for completeness
  PARKED: [0, 0],
};

interface SimVehicle extends MonitoredFleet {
  baseSpeed: number;
  driver_id: string; // links the on-map vehicle back to the shared Driver record
}

// ── Deterministic seed (mulberry32) so the initial roster is stable ──────────
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const seedRng = mulberry32(0x10c4_7e4);

// How many of the shared fleet vehicles appear on the live map.
const MAP_VEHICLE_COUNT = 12;

// Base status distribution for a believable control-room mix.
const BASE_STATUSES: MonitorStatus[] = [
  'IN_TRANSIT', 'IN_TRANSIT', 'IN_TRANSIT', 'IN_TRANSIT', 'IN_TRANSIT',
  'DISPATCHED', 'DISPATCHED', 'DELAYED', 'DELAYED', 'IN_TRANSIT', 'PARKED', 'IN_TRANSIT',
];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function coordNear(center: Coordinate, radiusKm: number, rng: () => number): Coordinate {
  const r = radiusKm * Math.sqrt(rng());
  const theta = rng() * 2 * Math.PI;
  const dLat = (r * Math.cos(theta)) / KM_PER_DEG_LAT;
  const dLng = (r * Math.sin(theta)) / (KM_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180));
  return { lat: +(center.lat + dLat).toFixed(5), lng: +(center.lng + dLng).toFixed(5) };
}

// Core south-Bali region centroids (drop the far-east coastal ones so roving
// vehicles stay within the operating BBOX). A live-map vehicle/drop-off is placed
// near one of these so it sits on land, not in the Badung Strait.
const CORE_CENTROIDS = LAND_CENTROIDS.filter((c) => c.lng <= 115.35);

/** A point on land — jittered ~2 km around a random core region centroid. */
function landPoint(rng: () => number): Coordinate {
  const c = CORE_CENTROIDS[Math.floor(rng() * CORE_CENTROIDS.length)];
  return coordNear(c, 2, rng);
}

/**
 * Build the live-map roster from the SHARED datasets (FLEET / DRIVERS / MANIFESTS
 * in data.ts) so the names, fleet IDs and manifest IDs on the map are the same
 * records the rest of the app uses — not a private list. Each on-map vehicle's
 * driver is marked ON_DUTY and bound to its fleet, so a driver who's already out
 * driving no longer shows up in the "available drivers" assignment list.
 */
function buildRoster(): SimVehicle[] {
  return BASE_STATUSES.slice(0, MAP_VEHICLE_COUNT).map((status, i) => {
    const fleet = FLEET[i];
    const driver = DRIVERS[i % DRIVERS.length];
    const manifest = MANIFESTS[i];

    // Reflect the on-map assignment back into the shared records so the
    // assign-driver modal (which lists AVAILABLE drivers) stays consistent.
    driver.status = 'ON_DUTY';
    driver.current_fleet_id = fleet.fleet_id;
    fleet.driver_id = driver.driver_id;

    const pos = landPoint(seedRng);
    const [lo, hi] = SPEED_RANGE[status];
    const baseSpeed = Math.round(lo + seedRng() * (hi - lo));
    return {
      fleet_id: fleet.fleet_id,
      driver_id: driver.driver_id,
      driver_name: driver.name,
      manifest_id: manifest.manifest_id,
      status,
      position: pos,
      speed_kmh: baseSpeed,
      heading: Math.floor(seedRng() * 360),
      eta: status === 'PARKED' ? 'TBD' : etaFromNow(20 + Math.floor(seedRng() * 160)),
      is_off_route: false,
      baseSpeed,
    };
  });
}

function etaFromNow(mins: number): string {
  const d = new Date(Date.now() + mins * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── Singleton state ──────────────────────────────────────────────────────────
const roster: SimVehicle[] = buildRoster();

// Active AI route (Process 2 output). Seeded with a placeholder so the map has
// something to draw on first load; replaced by the real dispatched route via
// `setActiveRoute` (Process 3) so Process 4 reflects what the dispatcher chose.
// Becomes null once a route completes (the polyline leaves the map).
let activeRoute: ActiveRoute | null = (() => {
  const assigned = roster.find((v) => v.status === 'IN_TRANSIT') ?? roster[0];
  const dropPts: Coordinate[] = [landPoint(seedRng), landPoint(seedRng), landPoint(seedRng)];
  return {
    route_id: 'rt_live_01',
    fleet_id: assigned.fleet_id,
    waypoints: [WAREHOUSE_ORIGIN, ...dropPts],
    dropoffs: dropPts.map((p, i) => ({
      seq: i + 1,
      lat: p.lat,
      lng: p.lng,
      manifest_id: `MNF-${240050 + i}`,
    })),
  };
})();

// Index of the next waypoint the active vehicle is driving toward (waypoints[0]
// is the origin it starts from). Reset on every setActiveRoute.
let activeLeg = 1;

// Seed one initial off-route vehicle so the alert panel has something on load.
// Pick an IN_TRANSIT vehicle that isn't the active-route follower (whose
// deviations get cleared as it tracks its polyline).
const offRouteSeed = roster.find(
  (v) => v.status === 'IN_TRANSIT' && v.fleet_id !== activeRoute?.fleet_id,
);
if (offRouteSeed) offRouteSeed.is_off_route = true;

/** Initial compass bearing (0–359°) from `a` to `b`, for pointing the icon. */
function bearing(a: Coordinate, b: Coordinate): number {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ── Movement ─────────────────────────────────────────────────────────────────
function advance(v: SimVehicle): void {
  // Off-route / parked dynamics.
  if (v.status === 'PARKED') {
    v.speed_kmh = 0;
    return;
  }

  // The dispatched vehicle deterministically follows its route to completion,
  // then frees its driver/fleet — closing the Process 3 → 4 lifecycle loop.
  if (activeRoute && v.fleet_id === activeRoute.fleet_id) {
    advanceAlongRoute(v, activeRoute);
    return;
  }
  if (v.is_off_route) {
    if (Math.random() < 0.12) v.is_off_route = false; // recovery (EXCEPTION → moving)
  } else if (Math.random() < 0.02) {
    v.is_off_route = true; // deviation
  }

  // Live speed: off-route crawls; otherwise base speed ± jitter.
  const [lo, hi] = SPEED_RANGE[v.status];
  v.speed_kmh = v.is_off_route
    ? Math.round(4 + Math.random() * 10)
    : clamp(Math.round(v.baseSpeed + (Math.random() - 0.5) * 10), lo, hi);

  // Heading jitter (more erratic when off-route).
  v.heading = (v.heading + (Math.random() - 0.5) * (v.is_off_route ? 60 : 18) + 360) % 360;

  const distKm = v.speed_kmh * DT_HOURS;
  const rad = (v.heading * Math.PI) / 180;
  let lat = v.position.lat + (distKm / KM_PER_DEG_LAT) * Math.cos(rad);
  let lng =
    v.position.lng + (distKm / (KM_PER_DEG_LAT * Math.cos((v.position.lat * Math.PI) / 180))) * Math.sin(rad);

  // Reflect off the bounding box so vehicles stay on the island.
  if (lat < BBOX.minLat || lat > BBOX.maxLat) {
    v.heading = (180 - v.heading + 360) % 360;
    lat = clamp(lat, BBOX.minLat, BBOX.maxLat);
  }
  if (lng < BBOX.minLng || lng > BBOX.maxLng) {
    v.heading = (360 - v.heading) % 360;
    lng = clamp(lng, BBOX.minLng, BBOX.maxLng);
  }

  v.position = { lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
}

/**
 * Drive the dispatched vehicle along its route polyline (waypoint → waypoint).
 * When it passes the final drop-off the route is complete: the vehicle parks and
 * its driver/fleet are released back to the pool (see `completeActiveRoute`).
 */
function advanceAlongRoute(v: SimVehicle, route: ActiveRoute): void {
  v.is_off_route = false;
  const [lo, hi] = SPEED_RANGE.IN_TRANSIT;
  v.speed_kmh = clamp(Math.round(v.baseSpeed + (Math.random() - 0.5) * 8), lo, hi);

  // Follow the road-snapped polyline when present (turn-by-turn like Google Maps),
  // otherwise fall back to the straight origin→drop-off waypoints.
  const wps = route.path && route.path.length > 1 ? route.path : route.waypoints;
  let stepKm = v.speed_kmh * DT_HOURS * SIM_SPEEDUP;

  while (stepKm > 0 && activeLeg < wps.length) {
    const target = wps[activeLeg];
    const distKm = haversineKm(v.position, target);

    if (distKm <= stepKm + ARRIVE_EPS_KM) {
      // Reached this waypoint — snap to it and aim at the next.
      v.position = { lat: target.lat, lng: target.lng };
      stepKm -= distKm;
      activeLeg += 1;
    } else {
      // Partial hop toward the target along the straight segment.
      const f = stepKm / distKm;
      v.heading = bearing(v.position, target);
      v.position = {
        lat: +(v.position.lat + (target.lat - v.position.lat) * f).toFixed(5),
        lng: +(v.position.lng + (target.lng - v.position.lng) * f).toFixed(5),
      };
      stepKm = 0;
    }
  }

  if (activeLeg >= wps.length) completeActiveRoute(v, route);
}

/**
 * Close the lifecycle loop: the vehicle has delivered every stop. Park it, return
 * its driver to AVAILABLE and its fleet to IDLE (both re-enter the assignable
 * pool), mark the route's manifests DELIVERED, and clear the active route so its
 * polyline leaves the map.
 */
function completeActiveRoute(v: SimVehicle, route: ActiveRoute): void {
  v.status = 'PARKED';
  v.speed_kmh = 0;
  v.is_off_route = false;
  v.eta = 'TBD';

  const driver = DRIVERS.find((d) => d.driver_id === v.driver_id);
  if (driver) {
    driver.status = 'AVAILABLE';
    driver.current_fleet_id = null;
  }

  const fleet = FLEET.find((f) => f.fleet_id === v.fleet_id);
  if (fleet) {
    fleet.status = 'IDLE';
    fleet.driver_id = null;
    fleet.active_route_id = null;
  }

  const now = new Date().toISOString();
  const delivered = new Set(route.dropoffs.map((d) => d.manifest_id));
  for (const m of MANIFESTS) {
    if (delivered.has(m.manifest_id)) {
      m.status = 'DELIVERED';
      m.delivered_at = now;
    }
  }

  activeRoute = null;
  activeLeg = 1;
}

// ── Public API (consumed by the MSW handlers) ────────────────────────────────

/** Advance the simulation one tick and emit the GPS pings (GET /api/v1/telemetry). */
export function tickTelemetry(): TelemetryPing[] {
  const now = new Date().toISOString();
  roster.forEach(advance);
  return roster.map((v) => ({
    fleet_id: v.fleet_id,
    position: v.position,
    speed_kmh: v.speed_kmh,
    heading: Math.round(v.heading),
    timestamp: now,
    is_off_route: v.is_off_route,
  }));
}

/**
 * Bridge a dispatched Process 2 route into the live-map simulation (Process 3 →
 * 4). Replaces the active route with the dispatcher's actual sequence and snaps
 * the assigned vehicle to the warehouse origin so it departs along that route.
 *
 * `driver` is the operator chosen in the assign-driver modal; it's stamped onto
 * the on-map vehicle so the Live Map shows the driver you actually assigned
 * (not the roster's seeded driver).
 *
 * Called client-side from useDispatch (the optimize route handler runs
 * server-side and can't reach this browser singleton directly).
 */
export function setActiveRoute(
  route: Route,
  driver?: { driver_id?: string; driver_name?: string },
): void {
  const origin = route.waypoints[0] ?? WAREHOUSE_ORIGIN;
  const stops = route.waypoints.slice(1);
  const dropoffs = stops.map((p, i) => ({
    seq: i + 1,
    lat: p.lat,
    lng: p.lng,
    manifest_id: route.optimized_sequence[i] ?? `MNF-${i + 1}`,
  }));

  // Use the dispatched vehicle if it's in the live roster; otherwise fall back to
  // a roster vehicle so the highlighted marker always sits on the drawn route.
  const vehicle =
    roster.find((v) => v.fleet_id === route.fleet_id) ??
    roster.find((v) => v.status === 'IN_TRANSIT') ??
    roster[0];

  // Stage it at the depot and send it out on the new route.
  vehicle.position = { lat: origin.lat, lng: origin.lng };
  vehicle.status = 'IN_TRANSIT';
  vehicle.is_off_route = false;
  vehicle.speed_kmh = vehicle.baseSpeed;
  if (dropoffs.length) vehicle.heading = bearing(origin, dropoffs[0]);

  // Reflect the assigned driver on the map (and keep the shared records in sync).
  if (driver?.driver_name) vehicle.driver_name = driver.driver_name;
  if (driver?.driver_id) vehicle.driver_id = driver.driver_id;
  if (route.optimized_sequence[0]) vehicle.manifest_id = route.optimized_sequence[0];

  activeRoute = {
    route_id: route.route_id,
    fleet_id: vehicle.fleet_id,
    waypoints: route.waypoints,
    dropoffs,
    path: route.path, // road-snapped polyline the vehicle follows, when available
  };
  activeLeg = 1; // start driving toward the first track point
}

// route_id → Route, recorded at optimize time. A dispatch request only carries
// the route_id, so this lets the dispatch handler replay the dispatcher's actual
// path onto the live map — closing the Process 2 → 3 → 4 flow even when optimize
// and dispatch run in separate requests (the server-side, no-MSW path).
const optimizedRoutes = new Map<string, Route>();

/** Remember a freshly-optimized route so a later dispatch can activate it. */
export function recordOptimizedRoute(route: Route): void {
  optimizedRoutes.set(route.route_id, route);
}

/**
 * Activate a previously-recorded route on the live map for the dispatched
 * fleet/driver. Returns false when the route_id was never optimized here.
 */
export function activateDispatchedRoute(
  route_id: string,
  fleet_id: string,
  driver?: { driver_id?: string; driver_name?: string },
): boolean {
  const route = optimizedRoutes.get(route_id);
  if (!route) return false;
  setActiveRoute({ ...route, fleet_id }, driver);
  return true;
}

/** Current roster + active route snapshot (GET /api/v1/fleet/active). */
export function getActiveFleet(): ActiveFleetResponse {
  const fleets: MonitoredFleet[] = roster.map((v) => ({
    fleet_id: v.fleet_id,
    driver_name: v.driver_name,
    manifest_id: v.manifest_id,
    status: v.status,
    position: v.position,
    speed_kmh: v.speed_kmh,
    heading: v.heading,
    eta: v.eta,
    is_off_route: v.is_off_route,
  }));
  return { fleets, route: activeRoute, server_time: new Date().toISOString() };
}

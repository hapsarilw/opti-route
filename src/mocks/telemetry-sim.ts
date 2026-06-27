import type {
  ActiveFleetResponse,
  ActiveRoute,
  Coordinate,
  MonitoredFleet,
  MonitorStatus,
  TelemetryPing,
} from '@/types';
import { WAREHOUSE_ORIGIN } from '@/config/constants';

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

const DRIVERS = [
  'Budi Santoso', 'Ahmad Fauzi', 'Dewi Rahayu', 'Rizky Pratama', 'Hendra Wijaya',
  'Agus Salim', 'Nurul Hidayat', 'Putu Adnyana', 'Kadek Mertha', 'Wayan Sukarya',
  'Made Indra', 'Komang Yasa',
] as const;

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

function buildRoster(): SimVehicle[] {
  return BASE_STATUSES.map((status, i) => {
    const pos = coordNear(WAREHOUSE_ORIGIN, 16, seedRng);
    const [lo, hi] = SPEED_RANGE[status];
    const baseSpeed = Math.round(lo + seedRng() * (hi - lo));
    return {
      fleet_id: `FLT-${String(i + 1).padStart(3, '0')}`,
      driver_name: DRIVERS[i % DRIVERS.length],
      manifest_id: `MNF-${240001 + i * 3}`,
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

// Seed one initial off-route vehicle so the alert panel has something on load.
const firstMoving = roster.find((v) => v.status === 'IN_TRANSIT');
if (firstMoving) firstMoving.is_off_route = true;

// Active AI route (Process 2 output) — depot → 3 drop-offs, near an in-transit truck.
const ACTIVE_ROUTE: ActiveRoute = (() => {
  const assigned = roster.find((v) => v.status === 'IN_TRANSIT') ?? roster[0];
  const dropPts: Coordinate[] = [
    coordNear(WAREHOUSE_ORIGIN, 8, seedRng),
    coordNear(WAREHOUSE_ORIGIN, 13, seedRng),
    coordNear(WAREHOUSE_ORIGIN, 18, seedRng),
  ];
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

// ── Movement ─────────────────────────────────────────────────────────────────
function advance(v: SimVehicle): void {
  // Off-route / parked dynamics.
  if (v.status === 'PARKED') {
    v.speed_kmh = 0;
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
  return { fleets, route: ACTIVE_ROUTE, server_time: new Date().toISOString() };
}

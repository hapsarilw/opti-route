import type {
  Coordinate,
  Driver,
  DriverStatus,
  Fleet,
  Manifest,
  Priority,
  User,
  VehicleType,
} from '@/types';
import { permissionsForRole } from '@/lib/rbac';

/**
 * Mock dataset (Doc 01 §2) — Bali/Denpasar themed.
 *
 * Everything here is generated ONCE at import time from a fixed seed, so the
 * 10,000 manifests, fleet, and drivers are *deterministic*: the same rows come
 * back on every reload. That stability is what lets server-side pagination and
 * row virtualization (Phase 1) behave predictably across refetches.
 */

/** Warehouse origin — central Bali (CLAUDE.md / Doc 01 §5.2). */
export const WAREHOUSE_ORIGIN: Coordinate = { lat: -8.65, lng: 115.2167 };

const MANIFEST_COUNT = 10_000;
const FLEET_COUNT = 30;
const DRIVER_COUNT = 50;

// ── Seeded PRNG (mulberry32) — deterministic, dependency-free ───────────────
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

const SEED = 0x0091_7e5; // fixed seed => identical dataset every run
const rng = mulberry32(SEED);

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number): number => Math.floor(rng() * (max - min + 1)) + min;

// ── Bali domain vocabulary ──────────────────────────────────────────────────
const REGIONS = [
  'Denpasar Utara',
  'Denpasar Selatan',
  'Denpasar Timur',
  'Kuta',
  'Seminyak',
  'Ubud',
  'Sanur',
  'Gianyar',
  'Jimbaran',
  'Canggu',
  'Nusa Dua',
  'Benoa',
  'Klungkung',
  'Padang Bai',
] as const;

const BIZ_PREFIX = ['PT', 'CV', 'UD', 'Toko', 'Hotel', 'Warung', 'Koperasi', 'RS', 'Apotek', 'Restoran'] as const;
const BIZ_CORE = [
  'Bali Fresh',
  'Sari Bumi',
  'Tirta Gangga',
  'Dewata Agung',
  'Karya Sejahtera',
  'Merta Sari',
  'Bali Tangi',
  'Surya Kencana',
  'Wijaya Kusuma',
  'Bumi Ayu',
  'Tanah Lot',
  'Bali Hai',
  'Putra Mandiri',
  'Segara Madu',
  'Bali Niksoma',
  'Anugerah Jaya',
  'Tirta Empul',
  'Mega Buana',
  'Bali Citra',
  'Dwi Karya',
  'Sumber Rejeki',
  'Bali Kencana',
  'Catur Yoga',
  'Krisna Oleh-Oleh',
  'Pondok Bambu',
  'Bali Asri',
  'Gunung Agung',
  'Lestari Indah',
  'Bali Pawitra',
  'Nusa Indah',
] as const;
const BIZ_SUFFIX = ['', '', ' Tbk', ' Group', ' Indonesia', ' Nusantara', ' Sejahtera', ' Mandiri', ' Abadi'] as const;

const STREETS = [
  'Jl. Sunset Road',
  'Jl. Bypass Ngurah Rai',
  'Jl. Raya Ubud',
  'Jl. Legian',
  'Jl. Diponegoro',
  'Jl. Gatot Subroto',
  'Jl. Teuku Umar',
  'Jl. Hayam Wuruk',
  'Jl. Danau Tamblingan',
  'Jl. Pantai Berawa',
  'Jl. Raya Canggu',
  'Jl. Uluwatu',
] as const;

// Balinese given names (caste/birth-order prefixes + common names)
const BALI_FIRST = ['Wayan', 'Made', 'Nyoman', 'Ketut', 'Putu', 'Kadek', 'Komang', 'Gede', 'Gusti', 'Ida Bagus'] as const;
const BALI_LAST = [
  'Suparta',
  'Gunawan',
  'Aditya',
  'Mahendra',
  'Indra',
  'Santoso',
  'Pratama',
  'Wijaya',
  'Sukarya',
  'Darmawan',
  'Sudana',
  'Mertha',
  'Astawa',
  'Wibawa',
  'Yasa',
  'Nugraha',
] as const;

// ── Geo helpers ───────────────────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Random coordinate within `radiusKm` of a center, uniformly over the disc. */
function coordNear(center: Coordinate, radiusKm: number): Coordinate {
  const r = radiusKm * Math.sqrt(rng()); // sqrt => uniform area, not clustered at center
  const theta = rng() * 2 * Math.PI;
  const dLat = (r * Math.cos(theta)) / 111;
  const dLng = (r * Math.sin(theta)) / (111 * Math.cos(toRad(center.lat)));
  return { lat: +(center.lat + dLat).toFixed(5), lng: +(center.lng + dLng).toFixed(5) };
}

const round = (n: number, d = 0) => +n.toFixed(d);

// ── Generators ──────────────────────────────────────────────────────────────
function pickPriority(): Priority {
  const r = rng();
  if (r < 0.3) return 'HIGH'; // ~30%
  if (r < 0.8) return 'NORMAL'; // ~50%
  return 'LOW'; // ~20%
}

function recipientName(): string {
  return `${pick(BIZ_PREFIX)} ${pick(BIZ_CORE)}${pick(BIZ_SUFFIX)}`;
}

function isoWithinLastDays(days: number): string {
  const now = Date.now();
  const span = days * 24 * 60 * 60 * 1000;
  return new Date(now - Math.floor(rng() * span)).toISOString();
}

function generateManifests(): Manifest[] {
  const out: Manifest[] = new Array(MANIFEST_COUNT);
  for (let i = 0; i < MANIFEST_COUNT; i++) {
    const region = pick(REGIONS);
    out[i] = {
      manifest_id: `MNF-${240001 + i}`, // MNF-240001 … MNF-250000
      recipient_name: recipientName(),
      address: `${pick(STREETS)} No. ${int(1, 220)}, ${region}`,
      region,
      destination: coordNear(WAREHOUSE_ORIGIN, 30),
      priority: pickPriority(),
      weight_kg: int(50, 5000),
      status: 'QUEUED', // all manifests start QUEUED (Doc 01 §3)
      created_at: isoWithinLastDays(7),
      assigned_fleet_id: null,
      assigned_driver_id: null,
      route_id: null,
      sequence_order: null,
      delivered_at: null,
    };
  }
  return out;
}

const VEHICLE_TYPES: readonly VehicleType[] = ['TRUCK', 'VAN', 'MOTORCYCLE'];
const CAPACITY_BY_TYPE: Record<VehicleType, [number, number]> = {
  TRUCK: [3000, 8000],
  VAN: [800, 2000],
  MOTORCYCLE: [30, 120],
};

function plateNumber(): string {
  const digits = int(1000, 9999);
  const a = String.fromCharCode(65 + int(0, 25));
  const b = String.fromCharCode(65 + int(0, 25));
  return `DK ${digits} ${a}${b}`;
}

function generateFleet(): Fleet[] {
  return Array.from({ length: FLEET_COUNT }, (_, i) => {
    const vehicle_type = pick(VEHICLE_TYPES);
    const [capMin, capMax] = CAPACITY_BY_TYPE[vehicle_type];
    return {
      fleet_id: `FLT-${String(i + 1).padStart(3, '0')}`,
      plate_number: plateNumber(),
      vehicle_type,
      capacity_kg: round(int(capMin, capMax), 0),
      status: 'IDLE', // initial status
      current_coordinate: coordNear(WAREHOUSE_ORIGIN, 25),
      driver_id: null,
      active_route_id: null,
      last_telemetry_at: null,
    } satisfies Fleet;
  });
}

function driverName(): string {
  return `${pick(BALI_FIRST)} ${pick(BALI_LAST)}`;
}

function pickDriverStatus(): DriverStatus {
  const r = rng();
  if (r < 0.5) return 'AVAILABLE'; // ~50%
  if (r < 0.8) return 'ON_DUTY'; // ~30%
  return 'OFF'; // ~20%
}

function generateDrivers(): Driver[] {
  return Array.from({ length: DRIVER_COUNT }, (_, i) => ({
    driver_id: `DRV-${String(i + 1).padStart(3, '0')}`,
    name: driverName(),
    phone: `+62 8${int(10, 89)}-${int(1000, 9999)}-${int(1000, 9999)}`,
    status: pickDriverStatus(),
    current_fleet_id: null,
    location: coordNear(WAREHOUSE_ORIGIN, 20),
  }));
}

// ── RBAC demo users (Doc 01 §4 matrix) ───────────────────────────────────────
const makeUser = (user_id: string, name: string, role: User['role']): User => ({
  user_id,
  name,
  role,
  permissions: permissionsForRole(role),
});

export const USERS: Record<User['role'], User> = {
  dispatcher: makeUser('usr_99823', 'Dispatcher', 'dispatcher'),
  admin: makeUser('usr_10001', 'Admin', 'admin'),
  manager: makeUser('usr_20002', 'Manager', 'manager'),
};

// ── Singleton datasets (generated once, deterministic) ───────────────────────
export const MANIFESTS: Manifest[] = generateManifests();
export const FLEET: Fleet[] = generateFleet();
export const DRIVERS: Driver[] = generateDrivers();

export const db = {
  manifests: MANIFESTS,
  fleet: FLEET,
  drivers: DRIVERS,
  users: USERS,
  origin: WAREHOUSE_ORIGIN,
} as const;

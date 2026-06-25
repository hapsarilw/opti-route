/**
 * Enums & constants — derived verbatim from Doc 01 §4 (Data Model Contracts).
 * These are the single source of truth for every status/role/permission union
 * used across the app. Do not add values without updating Doc 01.
 */

/** Shared geo primitive used by manifests, fleet, drivers, routes, telemetry. */
export interface Coordinate {
  lat: number;
  lng: number;
}

export type Priority = 'HIGH' | 'NORMAL' | 'LOW';

/** The 9-state manifest lifecycle (Doc 01 §3). Order matters for the machine. */
export type ManifestStatus =
  | 'QUEUED'
  | 'SELECTED'
  | 'OPTIMIZING'
  | 'OPTIMIZED'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'EXCEPTION';

export type FleetStatus = 'IDLE' | 'DISPATCHED' | 'EN_ROUTE' | 'RETURNING' | 'OFFLINE';

export type VehicleType = 'TRUCK' | 'VAN' | 'MOTORCYCLE';

export type DriverStatus = 'AVAILABLE' | 'ON_DUTY' | 'OFF';

export type RouteStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED';

export type Role = 'admin' | 'dispatcher' | 'manager';

export type Permission =
  | 'manifest:read'
  | 'manifest:delete'
  | 'route:optimize'
  | 'route:dispatch'
  | 'config:tariff:read'
  | 'config:tariff:write';

/** Ordered list of the 9 statuses — handy for iteration, legends, filters. */
export const MANIFEST_STATUSES: readonly ManifestStatus[] = [
  'QUEUED',
  'SELECTED',
  'OPTIMIZING',
  'OPTIMIZED',
  'ASSIGNED',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'EXCEPTION',
] as const;

export const PRIORITIES: readonly Priority[] = ['HIGH', 'NORMAL', 'LOW'] as const;

export const ROLES: readonly Role[] = ['admin', 'dispatcher', 'manager'] as const;

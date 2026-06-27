import type { Coordinate, FleetStatus, Priority } from './enums';
import type { Manifest } from './manifest';
import type { Fleet } from './fleet';

/**
 * API request/response contracts — Doc 01 §5 (mock endpoints served by MSW).
 */

/** GET /api/v1/manifests query params (Doc 01 §5.1). */
export interface ManifestQuery {
  q?: string; // fuzzy search
  region?: string;
  priority?: Priority;
  status?: Manifest['status'];
  sort?: string; // e.g. "weight_kg:desc"
  cursor?: number; // pagination / virtual window
}

export interface ManifestListResponse {
  data: Manifest[];
  total: number;
}

/** GET /api/v1/fleet — fleet roster used by the optimize drawer (IDLE) & dispatch. */
export interface FleetQuery {
  status?: FleetStatus;
  limit?: number;
}

export interface FleetListResponse {
  data: Fleet[];
  total: number;
}

/** POST /api/v1/route/optimize (Doc 01 §5.2). */
export interface OptimizeDestination {
  manifest_id: string;
  lat: number;
  lng: number;
  priority: Priority;
  weight_kg: number;
}

export interface OptimizeRequest {
  dispatcher_id: string;
  fleet_id: string;
  origin_coordinate: Coordinate;
  destinations: OptimizeDestination[];
}

export interface OptimizeResponse {
  status: 'success' | 'error';
  route_id: string;
  optimized_sequence: string[];
  waypoints: Coordinate[];
  estimated_total_duration_mins: number;
  ai_insights: string;
}

/** POST /api/v1/dispatch (Doc 01 §5.3). */
export interface DispatchRequest {
  route_id: string;
  fleet_id: string;
  driver_id: string;
}

export interface DispatchResponse {
  status: 'dispatched';
  dispatched_at: string; // ISO8601
}

/** WS /ws/telemetry payload (Doc 01 §5.4). */
export interface TelemetryMessage {
  type: 'telemetry';
  pings: import('./telemetry').TelemetryPing[];
}

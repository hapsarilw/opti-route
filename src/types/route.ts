import type { Coordinate, RouteStatus } from './enums';

/**
 * Route — the AI optimization result (Doc 01 §2.4).
 * Produced by Process 2 (AI Engine), consumed by the map & dispatch (Process 3/4).
 */
export interface Route {
  route_id: string; // PK
  dispatcher_id: string; // FK -> User (creator)
  fleet_id: string; // FK -> Fleet
  origin_coordinate: Coordinate; // warehouse start
  optimized_sequence: string[]; // ["MNF-003","MNF-001","MNF-002"] drop-off order
  waypoints: Coordinate[]; // points for drawing the map polyline
  path?: Coordinate[]; // road-snapped polyline (Mapbox Directions), when available
  estimated_total_duration_mins: number;
  ai_insights: string; // LLM narrative shown in the drawer
  status: RouteStatus;
  created_at: string;
}

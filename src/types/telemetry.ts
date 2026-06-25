import type { Coordinate } from './enums';

/** TelemetryPing — periodic GPS sample (Doc 01 §2.6, Process 4). */
export interface TelemetryPing {
  fleet_id: string; // FK -> Fleet
  position: Coordinate;
  speed_kmh: number;
  heading: number; // 0–359 degrees (map icon rotation)
  timestamp: string; // ISO8601
  is_off_route: boolean; // true => triggers an "off-route" alert
}

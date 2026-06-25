import type { Coordinate, FleetStatus, VehicleType } from './enums';

/** Fleet — a vehicle/truck (Doc 01 §2.2). */
export interface Fleet {
  fleet_id: string; // "flt_truck_02" — PK
  plate_number: string; // "DK 1234 AB"
  vehicle_type: VehicleType;
  capacity_kg: number;
  status: FleetStatus;
  current_coordinate: Coordinate; // updated by telemetry
  driver_id?: string | null;
  active_route_id?: string | null;
  last_telemetry_at?: string | null; // ISO8601 — detect "lost signal"
}

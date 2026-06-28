import type { Coordinate, DriverStatus, VehicleType } from './enums';

/** Driver — a vehicle operator (Doc 01 §2.3). */
export interface Driver {
  driver_id: string; // PK
  name: string;
  phone: string;
  status: DriverStatus;
  vehicle_type: VehicleType; // license class — which fleet type they may operate
  current_fleet_id?: string | null;
  location?: Coordinate | null; // for the "nearest driver" Haversine ranking (Process 3)
}

import type { Coordinate, ManifestStatus, Priority } from './enums';

/**
 * Manifest — the central delivery-order entity (Doc 01 §2.1).
 * One Data Grid row = one Manifest. Its `status` drives the whole 4-process flow.
 */
export interface Manifest {
  manifest_id: string; // "MNF-001" — PK, pinned in the grid
  recipient_name: string;
  address: string;
  region: string; // e.g. "Denpasar Selatan" — used by the region filter
  destination: Coordinate; // drop-off point on the map
  priority: Priority;
  weight_kg: number;
  status: ManifestStatus;
  created_at: string; // ISO8601 — queue order

  // Filled in as the process advances (null at ingestion):
  assigned_fleet_id?: string | null; // Process 3
  assigned_driver_id?: string | null; // Process 3
  route_id?: string | null; // Process 2/3
  sequence_order?: number | null; // AI drop-off order (1,2,3…)
  delivered_at?: string | null; // Process 4
}

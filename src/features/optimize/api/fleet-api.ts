import type { Fleet, FleetListResponse } from '@/types';

/**
 * GET /api/v1/fleet?status=IDLE — assignable vehicles for the optimize drawer.
 * Only IDLE fleet can take a fresh route (Doc 01 §2.2 FleetStatus).
 */
export async function fetchIdleFleet(): Promise<Fleet[]> {
  const res = await fetch('/api/v1/fleet?status=IDLE&limit=100');
  if (!res.ok) throw new Error(`fleet fetch failed: ${res.status}`);
  const body = (await res.json()) as FleetListResponse;
  return body.data;
}

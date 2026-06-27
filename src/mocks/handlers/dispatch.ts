import { http, HttpResponse } from 'msw';
import type { DispatchRequest, DispatchResponse } from '@/types';
import { DRIVERS, FLEET, MANIFESTS, routeManifestMap } from '../data';

/**
 * POST /api/v1/dispatch — Process 3 fleet assignment (Doc 01 §5.3).
 * Mutates three in-memory collections so subsequent refetches reflect the new state:
 *   Fleet  → status=DISPATCHED, active_route_id
 *   Driver → status=ON_DUTY, current_fleet_id
 *   Manifest(s) → status=DISPATCHED, assigned_driver_id, assigned_fleet_id
 */
export const dispatchHandler = http.post('/api/v1/dispatch', async ({ request }) => {
  const { route_id, fleet_id, driver_id } = (await request.json()) as DispatchRequest;

  // Fleet
  const fleet = FLEET.find((f) => f.fleet_id === fleet_id);
  if (fleet) {
    fleet.status = 'DISPATCHED';
    fleet.active_route_id = route_id;
  }

  // Driver
  const driver = DRIVERS.find((d) => d.driver_id === driver_id);
  if (driver) {
    driver.status = 'ON_DUTY';
    driver.current_fleet_id = fleet_id;
  }

  // Manifests belonging to this route
  const manifestIds = routeManifestMap.get(route_id);
  if (manifestIds) {
    const idSet = new Set(manifestIds);
    for (const m of MANIFESTS) {
      if (idSet.has(m.manifest_id)) {
        m.status = 'DISPATCHED';
        m.assigned_driver_id = driver_id;
        m.assigned_fleet_id = fleet_id;
        m.route_id = route_id;
      }
    }
  }

  const body: DispatchResponse = {
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
  };
  return HttpResponse.json(body);
});

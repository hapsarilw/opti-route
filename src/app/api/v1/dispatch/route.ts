import { NextResponse } from 'next/server';
import type { DispatchRequest, DispatchResponse } from '@/types';
import { DRIVERS, FLEET, MANIFESTS, routeManifestMap } from '@/mocks/data';
import { activateDispatchedRoute } from '@/mocks/telemetry-sim';

/**
 * POST /api/v1/dispatch — Process 3 fleet assignment (Doc 01 §5.3).
 *
 * Mirrors the MSW handler in `src/mocks/handlers/dispatch.ts`. This server route
 * keeps dispatch working when the MSW service worker isn't controlling the page
 * (first load / after an HMR worker update). Both handlers mutate the same shared
 * in-memory collections (FLEET, DRIVERS, MANIFESTS, routeManifestMap).
 */
export async function POST(request: Request): Promise<NextResponse<DispatchResponse | { error: string }>> {
  let body: DispatchRequest;
  try {
    body = (await request.json()) as DispatchRequest;
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const { route_id, fleet_id, driver_id } = body;
  if (!route_id || !fleet_id || !driver_id) {
    return NextResponse.json({ error: 'route_id, fleet_id and driver_id are required.' }, { status: 400 });
  }

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

  // Live map (Process 4): replay the optimized route for the dispatched vehicle so
  // it departs the warehouse along the dispatcher's actual sequence.
  activateDispatchedRoute(route_id, fleet_id, { driver_id, driver_name: driver?.name });

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

  return NextResponse.json({ status: 'dispatched', dispatched_at: new Date().toISOString() });
}

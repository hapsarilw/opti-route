import { NextResponse } from 'next/server';
import type { ActiveFleetResponse } from '@/types';
import { getActiveFleet } from '@/mocks/telemetry-sim';

/**
 * GET /api/v1/fleet/active — monitored roster + the active AI route (Process 4).
 *
 * Mirrors the MSW handler in `src/mocks/handlers/telemetry.ts`. Real server route
 * so the Live Map still loads (and reflects a dispatched route — see
 * `activateDispatchedRoute`) when the MSW service worker isn't controlling the
 * page. Reads sim state only; it doesn't advance the simulation.
 */
export function GET(): NextResponse<ActiveFleetResponse> {
  return NextResponse.json(getActiveFleet());
}

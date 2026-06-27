import { http, HttpResponse } from 'msw';
import { getActiveFleet, tickTelemetry } from '../telemetry-sim';

/**
 * GET /api/v1/telemetry — Process 4 live GPS feed (Doc 01 §5.4).
 * Each request advances the fleet simulation one tick and returns the latest
 * `TelemetryPing[]`. Polled by the client via TanStack Query `refetchInterval`.
 */
export const telemetryHandler = http.get('/api/v1/telemetry', () => {
  return HttpResponse.json(tickTelemetry());
});

/**
 * GET /api/v1/fleet/active — monitored fleet roster + the active AI route.
 * Static-ish metadata (driver, manifest, base status, ETA); live position/speed
 * arrives separately via the telemetry feed and is merged client-side.
 */
export const activeFleetHandler = http.get('/api/v1/fleet/active', () => {
  return HttpResponse.json(getActiveFleet());
});

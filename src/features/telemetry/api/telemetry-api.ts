import type { ActiveFleetResponse, TelemetryPing } from '@/types';

/** GET /api/v1/telemetry — live GPS pings (Doc 01 §5.4). */
export async function fetchTelemetry(): Promise<TelemetryPing[]> {
  const res = await fetch('/api/v1/telemetry');
  if (!res.ok) throw new Error(`telemetry fetch failed: ${res.status}`);
  return res.json() as Promise<TelemetryPing[]>;
}

/** GET /api/v1/fleet/active — monitored fleet roster + active route. */
export async function fetchActiveFleet(): Promise<ActiveFleetResponse> {
  const res = await fetch('/api/v1/fleet/active');
  if (!res.ok) throw new Error(`active fleet fetch failed: ${res.status}`);
  return res.json() as Promise<ActiveFleetResponse>;
}

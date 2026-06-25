import { http, HttpResponse } from 'msw';
import type { TelemetryPing } from '@/types';

/**
 * GET /api/v1/telemetry — Process 4 live GPS feed (Doc 01 §5.4).
 * Placeholder for now: returns an empty ping array. Phase 4 fills this with a
 * moving fleet simulation (polled via TanStack Query refetchInterval / WS).
 */
export const telemetryHandler = http.get('/api/v1/telemetry', () => {
  const pings: TelemetryPing[] = [];
  return HttpResponse.json(pings);
});

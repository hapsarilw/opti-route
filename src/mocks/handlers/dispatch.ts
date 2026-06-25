import { http, HttpResponse } from 'msw';
import type { DispatchRequest, DispatchResponse } from '@/types';

/**
 * POST /api/v1/dispatch — Process 3 fleet assignment (Doc 01 §5.3).
 * Accepts { route_id, fleet_id, driver_id }; confirms the dispatch.
 */
export const dispatchHandler = http.post('/api/v1/dispatch', async ({ request }) => {
  // Body is validated/consumed so the contract is honoured even though the mock
  // simply acknowledges; the real handler would mutate fleet/manifest state here.
  (await request.json()) as DispatchRequest;

  const body: DispatchResponse = {
    status: 'dispatched',
    dispatched_at: new Date().toISOString(),
  };
  return HttpResponse.json(body);
});

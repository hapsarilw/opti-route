import { http, HttpResponse } from 'msw';
import type { FleetListResponse } from '@/types';
import { FLEET } from '../data';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1_000;

/**
 * GET /api/v1/fleet — fleet roster (Doc 01 §2.2).
 * Optional `?status=IDLE` filters to assignable vehicles for the optimize drawer
 * (Process 2 fleet selector). Returns `{ data, total }` like the manifests list.
 */
export const fleetHandler = http.get('/api/v1/fleet', ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, MAX_LIMIT);

  let rows = FLEET;
  if (status) rows = rows.filter((f) => f.status === status);

  const total = rows.length;
  const data = rows.slice(0, limit);

  const body: FleetListResponse = { data, total };
  return HttpResponse.json(body);
});

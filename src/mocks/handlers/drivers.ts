import { http, HttpResponse } from 'msw';
import type { DriverListResponse } from '@/types';
import { DRIVERS } from '../data';

const DEFAULT_LIMIT = 200;

/**
 * GET /api/v1/drivers — driver roster (Doc 01 §2.3).
 * Optional `?status=AVAILABLE` filters to assignable drivers for Process 3.
 */
export const driversHandler = http.get('/api/v1/drivers', ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 500);

  let rows = DRIVERS;
  if (status) rows = rows.filter((d) => d.status === status);

  const total = rows.length;
  const data = rows.slice(0, limit);

  const body: DriverListResponse = { data, total };
  return HttpResponse.json(body);
});

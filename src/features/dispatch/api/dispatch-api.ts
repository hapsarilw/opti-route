import type { DispatchRequest, DispatchResponse, Driver, DriverListResponse } from '@/types';

/** GET /api/v1/drivers?status=AVAILABLE — available driver roster for Process 3. */
export async function fetchAvailableDrivers(): Promise<Driver[]> {
  const res = await fetch('/api/v1/drivers?status=AVAILABLE&limit=200');
  if (!res.ok) throw new Error(`drivers fetch failed: ${res.status}`);
  const body = (await res.json()) as DriverListResponse;
  return body.data;
}

/** POST /api/v1/dispatch — send fleet assignment (Doc 01 §5.3). */
export async function postDispatch(req: DispatchRequest): Promise<DispatchResponse> {
  const res = await fetch('/api/v1/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`dispatch failed: ${res.status}`);
  return (await res.json()) as DispatchResponse;
}

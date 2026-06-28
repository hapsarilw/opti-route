import { NextResponse } from 'next/server';
import type { DriverListResponse } from '@/types';
import { DRIVERS } from '@/mocks/data';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

/**
 * GET /api/v1/drivers — driver roster (Doc 01 §2.3).
 *
 * This mirrors the browser MSW handler in `src/mocks/handlers/drivers.ts`, but as
 * a real server route it keeps working when the MSW service worker isn't yet
 * controlling the page (first load / after an HMR worker update). MSW still
 * intercepts this path in the browser when active, so this only serves as the
 * fallback — the two read the same in-memory `DRIVERS` roster.
 *
 * Optional `?status=AVAILABLE` filters to assignable drivers for Process 3.
 */
export function GET(request: Request): NextResponse<DriverListResponse> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, MAX_LIMIT);

  let rows = DRIVERS;
  if (status) rows = rows.filter((d) => d.status === status);

  return NextResponse.json({ data: rows.slice(0, limit), total: rows.length });
}

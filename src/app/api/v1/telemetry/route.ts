import { NextResponse } from 'next/server';
import type { TelemetryPing } from '@/types';
import { tickTelemetry } from '@/mocks/telemetry-sim';

/**
 * GET /api/v1/telemetry — Process 4 live GPS feed (Doc 01 §5.4).
 *
 * Mirrors the MSW handler in `src/mocks/handlers/telemetry.ts`. This server route
 * keeps the Live Map streaming when the MSW service worker isn't controlling the
 * page (first load / after an HMR worker update). Each call advances the shared
 * in-memory simulation one tick and returns the latest pings.
 */
export function GET(): NextResponse<TelemetryPing[]> {
  return NextResponse.json(tickTelemetry());
}

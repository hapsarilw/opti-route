import type { RequestHandler } from 'msw';
import { manifestsHandler } from './manifests';
import { fleetHandler } from './fleet';
import { driversHandler } from './drivers';
import { dispatchHandler } from './dispatch';
import { telemetryHandler, activeFleetHandler } from './telemetry';

/**
 * MSW request handlers for the mock API contracts (Doc 01 §5):
 *   - GET  /api/v1/manifests        (Process 1)
 *   - GET  /api/v1/fleet            (Process 2 fleet selector / Process 3)
 *   - GET  /api/v1/drivers          (Process 3 — driver assignment)
 *   - POST /api/v1/dispatch         (Process 3)
 *   - GET  /api/v1/telemetry        (Process 4 — live GPS feed)
 *   - GET  /api/v1/fleet/active     (Process 4 — monitored roster + route)
 *
 * NOTE: POST /api/v1/route/optimize (Process 2) is intentionally NOT mocked here.
 * It is served by the real Next.js route handler at
 * `src/app/api/v1/route/optimize/route.ts`, which calls the LLM and falls back to
 * the deterministic optimizer. MSW passes it through (onUnhandledRequest: 'bypass').
 */
export const handlers: RequestHandler[] = [
  manifestsHandler,
  fleetHandler,
  driversHandler,
  activeFleetHandler,
  dispatchHandler,
  telemetryHandler,
];

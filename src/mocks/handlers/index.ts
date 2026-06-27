import type { RequestHandler } from 'msw';
import { manifestsHandler } from './manifests';
import { fleetHandler } from './fleet';
import { driversHandler } from './drivers';
import { optimizeHandler } from './optimize';
import { dispatchHandler } from './dispatch';
import { telemetryHandler, activeFleetHandler } from './telemetry';

/**
 * MSW request handlers for the mock API contracts (Doc 01 §5):
 *   - GET  /api/v1/manifests        (Process 1)
 *   - GET  /api/v1/fleet            (Process 2 fleet selector / Process 3)
 *   - GET  /api/v1/drivers          (Process 3 — driver assignment)
 *   - POST /api/v1/route/optimize   (Process 2)
 *   - POST /api/v1/dispatch         (Process 3)
 *   - GET  /api/v1/telemetry        (Process 4 — live GPS feed)
 *   - GET  /api/v1/fleet/active     (Process 4 — monitored roster + route)
 */
export const handlers: RequestHandler[] = [
  manifestsHandler,
  fleetHandler,
  driversHandler,
  activeFleetHandler,
  optimizeHandler,
  dispatchHandler,
  telemetryHandler,
];

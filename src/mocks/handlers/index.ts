import type { RequestHandler } from 'msw';
import { manifestsHandler } from './manifests';
import { optimizeHandler } from './optimize';
import { dispatchHandler } from './dispatch';
import { telemetryHandler } from './telemetry';

/**
 * MSW request handlers for the 4 mock API contracts (Doc 01 §5):
 *   - GET  /api/v1/manifests        (Process 1)
 *   - POST /api/v1/route/optimize   (Process 2)
 *   - POST /api/v1/dispatch         (Process 3)
 *   - GET  /api/v1/telemetry        (Process 4, placeholder)
 */
export const handlers: RequestHandler[] = [
  manifestsHandler,
  optimizeHandler,
  dispatchHandler,
  telemetryHandler,
];

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Browser-side MSW worker (dev). Started by the MSW bootstrap in providers. */
export const worker = setupWorker(...handlers);

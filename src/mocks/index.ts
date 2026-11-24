/**
 * In-flight/settled worker start, shared across callers. React Strict Mode runs
 * effects twice in dev, and MSW's `worker.start()` is not safe to call
 * concurrently: its "already enabled" guard runs before an `await`, so a second
 * overlapping call reaches `network.configure()` after the first enabled the
 * network and throws "cannot configure an already enabled network".
 */
let startPromise: Promise<void> | null = null;

/**
 * Starts MSW in the browser when mocking is enabled. Idempotent and safe to call
 * on every mount. Gated behind NEXT_PUBLIC_API_MOCKING so production builds can
 * opt out. Returns a promise that resolves once the worker is intercepting.
 */
export function enableMocking(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'disabled') return Promise.resolve();

  startPromise ??= (async () => {
    const { worker } = await import('./browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  })().catch((error: unknown) => {
    // Allow a later call to retry instead of caching the failure forever.
    startPromise = null;
    throw error;
  });

  return startPromise;
}

/**
 * Starts MSW in the browser when mocking is enabled. Idempotent and safe to call
 * on every mount. Gated behind NEXT_PUBLIC_API_MOCKING so production builds can
 * opt out. Returns a promise that resolves once the worker is intercepting.
 */
export async function enableMocking(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'disabled') return;

  const { worker } = await import('./browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

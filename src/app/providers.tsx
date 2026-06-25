'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';
import { enableMocking } from '@/mocks';

/** MSW is on unless explicitly disabled (mirrors `enableMocking`'s own gate). */
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING !== 'disabled';

/**
 * Client-side providers. The QueryClient is created once per browser session via
 * useState so it survives re-renders but isn't shared across SSR requests.
 *
 * MSW: the worker is started before the app renders so the first query already
 * hits the mock API. When mocking is disabled, we render immediately.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [ready, setReady] = useState(!MOCKING_ENABLED);

  useEffect(() => {
    if (!MOCKING_ENABLED) return;
    let active = true;
    enableMocking().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

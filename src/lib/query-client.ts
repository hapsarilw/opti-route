import { QueryClient } from '@tanstack/react-query';

/**
 * Factory for the app's QueryClient. Defaults tuned for the dispatcher workload:
 * - `staleTime` avoids refetch storms while panning the grid.
 * - `placeholderData` (set per-query) + these defaults keep INP < 200ms on filter.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

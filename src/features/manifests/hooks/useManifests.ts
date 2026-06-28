import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ManifestQuery } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import { fetchManifests } from '../api/manifests-api';

/**
 * Process 1 data hook (Doc 02 §1.2).
 * - Query key includes all filter params so MSW re-filters on each change.
 * - keepPreviousData: old data stays visible during filter transitions → INP < 200 ms.
 * - staleTime 30 s: no unnecessary refetches while the dispatcher works the grid.
 * - refetchOnMount 'always': every page load / revisit pulls fresh rows, so manifest
 *   statuses changed elsewhere (e.g. DELIVERED after a route completes) show up.
 * - retry 3 + backoff: the primary data load is resilient to a transient fetch
 *   hiccup (e.g. the mock worker settling on a hard reload) instead of dropping
 *   the user straight onto the "Couldn't load manifests" screen.
 */
export function useManifests(query: ManifestQuery) {
  return useQuery({
    queryKey: queryKeys.manifests.list(query),
    queryFn: () => fetchManifests(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnMount: 'always',
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
  });
}

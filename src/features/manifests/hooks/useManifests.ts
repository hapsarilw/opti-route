import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ManifestQuery } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import { fetchManifests } from '../api/manifests-api';

/**
 * Process 1 data hook (Doc 02 §1.2).
 * - Query key includes all filter params so MSW re-filters on each change.
 * - keepPreviousData: old data stays visible during filter transitions → INP < 200 ms.
 * - staleTime 30 s: no unnecessary refetches while the dispatcher works the grid.
 */
export function useManifests(query: ManifestQuery) {
  return useQuery({
    queryKey: queryKeys.manifests.list(query),
    queryFn: () => fetchManifests(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

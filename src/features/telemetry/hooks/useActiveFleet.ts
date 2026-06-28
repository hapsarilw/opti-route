'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchActiveFleet } from '../api/telemetry-api';

/**
 * Monitored fleet roster + active route (Process 4). Live positions arrive via
 * the separate telemetry poll, but the roster's *status* and the active route can
 * change mid-session (e.g. a dispatched vehicle finishes its route → PARKED and
 * the route clears), so we re-poll on a slow interval to surface those promptly.
 * `getActiveFleet` only reads sim state (it doesn't advance it), so this is cheap.
 */
export function useActiveFleet() {
  return useQuery({
    queryKey: queryKeys.telemetry.activeFleet,
    queryFn: fetchActiveFleet,
    staleTime: 4_000,
    refetchInterval: 4_000,
  });
}

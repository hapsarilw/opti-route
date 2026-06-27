'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchActiveFleet } from '../api/telemetry-api';

/**
 * Monitored fleet roster + active route (Process 4). Relatively static metadata,
 * so it's fetched once and kept fresh for the session; live positions arrive via
 * the separate telemetry poll.
 */
export function useActiveFleet() {
  return useQuery({
    queryKey: queryKeys.telemetry.activeFleet,
    queryFn: fetchActiveFleet,
    staleTime: 5 * 60_000,
  });
}

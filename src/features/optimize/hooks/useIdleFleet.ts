'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchIdleFleet } from '../api/fleet-api';

/** IDLE fleet for the optimize drawer's "Select Fleet" dropdown (Process 2). */
export function useIdleFleet() {
  return useQuery({
    queryKey: queryKeys.fleet.idle,
    queryFn: fetchIdleFleet,
    staleTime: 60_000,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchAvailableDrivers } from '../api/dispatch-api';

/** Fetches drivers with status=AVAILABLE, sorted by the caller (Haversine at render time). */
export function useAvailableDrivers() {
  return useQuery({
    queryKey: queryKeys.drivers.available,
    queryFn: fetchAvailableDrivers,
    staleTime: 10_000,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import type { TelemetryPing } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import { TELEMETRY_POLL_MS } from '@/config/constants';
import { fetchTelemetry } from '../api/telemetry-api';

/**
 * Live GPS poll (Doc 02 §4.1 / §5.4). `refetchInterval` re-fetches every ~2 s;
 * TanStack Query tears the interval down automatically when this hook unmounts
 * (navigating away from /map), so no manual interval leaks. `refetchIntervalIn
 * Background: false` pauses polling when the tab is hidden — saves work and keeps
 * the dashboard stable over long sessions.
 */
export function useTelemetry(enabled = true) {
  return useQuery<TelemetryPing[]>({
    queryKey: queryKeys.telemetry.pings,
    queryFn: fetchTelemetry,
    enabled,
    refetchInterval: TELEMETRY_POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
  });
}

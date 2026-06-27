'use client';

import { useMemo } from 'react';
import type { ActiveRoute, MonitoredFleet } from '@/types';
import { useActiveFleet } from './useActiveFleet';
import { useTelemetry } from './useTelemetry';

export interface LiveFleet {
  fleets: MonitoredFleet[]; // roster merged with the latest pings
  route: ActiveRoute | null;
  onRouteCount: number;
  exceptionCount: number;
  isLoading: boolean;
}

/**
 * Merge the static roster with the live telemetry pings (Doc 02 §4.2):
 *   position/speed/heading/is_off_route ← latest ping (falls back to roster)
 *   status ← EXCEPTION when off-route, otherwise the roster's base status.
 */
export function useLiveFleet(): LiveFleet {
  const { data: active, isLoading } = useActiveFleet();
  const { data: pings } = useTelemetry(!!active);

  return useMemo(() => {
    const roster = active?.fleets ?? [];
    const pingById = new Map((pings ?? []).map((p) => [p.fleet_id, p]));

    const fleets: MonitoredFleet[] = roster.map((f) => {
      const ping = pingById.get(f.fleet_id);
      const offRoute = ping?.is_off_route ?? f.is_off_route;
      return {
        ...f,
        position: ping?.position ?? f.position,
        speed_kmh: ping?.speed_kmh ?? f.speed_kmh,
        heading: ping?.heading ?? f.heading,
        is_off_route: offRoute,
        status: offRoute ? 'EXCEPTION' : f.status,
      };
    });

    return {
      fleets,
      route: active?.route ?? null,
      onRouteCount: fleets.filter((f) => f.status !== 'PARKED').length,
      exceptionCount: fleets.filter((f) => f.is_off_route).length,
      isLoading,
    };
  }, [active, pings, isLoading]);
}

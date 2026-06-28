'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DispatchRequest, DispatchResponse, Route } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/stores/toast-store';
import { setActiveRoute } from '@/mocks/telemetry-sim';
import { DRIVERS } from '@/mocks/data';
import { postDispatch } from '../api/dispatch-api';
import { markDispatched } from '../lib/dispatch-cache';

/**
 * Process 3 mutation (Doc 02 §3.3 #5-6).
 * onSuccess syncs three entities simultaneously:
 *   - Manifest(s) cache → DISPATCHED + assigned_driver_id/fleet_id
 *   - Fleet + Driver queries → invalidated so refetches reflect new in-memory state
 */
export function useDispatch() {
  const qc = useQueryClient();

  return useMutation<DispatchResponse, Error, DispatchRequest>({
    mutationFn: postDispatch,
    onSuccess: (_data, { route_id, fleet_id, driver_id }) => {
      // Patch manifest cache from the route stored by Process 2
      const route = qc.getQueryData<Route>(queryKeys.route.detail(route_id));
      if (route) {
        markDispatched(qc, route.optimized_sequence, driver_id, fleet_id);
        // Push the dispatched route into the live-map simulation so Process 4
        // shows the dispatcher's actual sequence (not the seeded placeholder),
        // stamped with the driver chosen in the assign modal.
        const driver = DRIVERS.find((d) => d.driver_id === driver_id);
        setActiveRoute({ ...route, fleet_id }, { driver_id, driver_name: driver?.name });
      }
      // Refetch fleet + drivers so live map and assignment lists stay fresh
      qc.invalidateQueries({ queryKey: queryKeys.fleet.all });
      qc.invalidateQueries({ queryKey: queryKeys.drivers.all });
      qc.invalidateQueries({ queryKey: queryKeys.telemetry.activeFleet });
    },
    onError: (err) => {
      toast.error('Dispatch failed', err.message);
    },
  });
}

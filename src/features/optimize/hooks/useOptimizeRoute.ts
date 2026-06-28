'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { OptimizeRequest, OptimizeResponse } from '@/types';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/stores/toast-store';
import { recordRouteManifests } from '@/mocks/data';
import { assertSequenceWithinSelection, postOptimize } from '../api/optimize-api';
import { applyOptimized, buildRoute, markOptimizing, rollbackToQueued } from '../lib/route-cache';

export interface OptimizeResult {
  res: OptimizeResponse;
  payload: OptimizeRequest;
}

/**
 * Process 2 mutation (Doc 02 §2.2). The mutation lifecycle IS the drawer's state
 * machine: pending → loading (B), success → result (C), error → error (D).
 *  - onMutate  : optimistic OPTIMIZING lock on the selected grid rows.
 *  - onSuccess : OPTIMIZED + sequence_order, cache the Route, success toast.
 *  - onError   : rollback to QUEUED (covers network, timeout, and Unknown-ID).
 */
export function useOptimizeRoute() {
  const qc = useQueryClient();

  return useMutation<OptimizeResult, Error, OptimizeRequest>({
    mutationFn: async (payload) => {
      const res = await postOptimize(payload);
      assertSequenceWithinSelection(res, new Set(payload.destinations.map((d) => d.manifest_id)));
      return { res, payload };
    },
    onMutate: (payload) => {
      markOptimizing(qc, payload.destinations.map((d) => d.manifest_id));
    },
    onSuccess: ({ res, payload }) => {
      applyOptimized(qc, res);
      qc.setQueryData(queryKeys.route.detail(res.route_id), buildRoute(res, payload));
      // The real optimize route handler runs server-side, so bridge the route's
      // manifest IDs into the browser-side mock store the dispatch handler reads.
      recordRouteManifests(res.route_id, res.optimized_sequence);
      toast.success(
        'Route optimized',
        `${res.optimized_sequence.length} stops sequenced · ~${res.estimated_total_duration_mins} min ETA`,
      );
    },
    onError: (err, payload) => {
      rollbackToQueued(qc, payload.destinations.map((d) => d.manifest_id));
      toast.error('Optimization failed', err.message);
    },
  });
}

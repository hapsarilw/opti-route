import type { QueryClient } from '@tanstack/react-query';
import type {
  Manifest,
  ManifestListResponse,
  ManifestStatus,
  OptimizeRequest,
  OptimizeResponse,
  Route,
} from '@/types';
import { queryKeys } from '@/lib/query-keys';

/**
 * Cache helpers that drive the Manifest state machine during Process 2 (Doc 01 §3).
 * The grid renders from the TanStack Query cache, so flipping statuses here makes
 * the rows reflect OPTIMIZING → OPTIMIZED (or roll back to QUEUED on failure).
 */

/** Apply `fn` to every manifest across all cached `['manifests', 'list', …]` queries. */
function patchManifests(qc: QueryClient, fn: (m: Manifest) => Manifest): void {
  qc.setQueriesData<ManifestListResponse>({ queryKey: queryKeys.manifests.all }, (old) =>
    old ? { ...old, data: old.data.map(fn) } : old,
  );
}

/** Pending: lock selected rows to OPTIMIZING (yellow, pulse). */
export function markOptimizing(qc: QueryClient, ids: string[]): void {
  const set = new Set(ids);
  patchManifests(qc, (m) =>
    set.has(m.manifest_id) ? { ...m, status: 'OPTIMIZING' as ManifestStatus } : m,
  );
}

/** Failure: rollback to QUEUED and clear any partial route fields (Doc 02 §2.4 #8). */
export function rollbackToQueued(qc: QueryClient, ids: string[]): void {
  const set = new Set(ids);
  patchManifests(qc, (m) =>
    set.has(m.manifest_id)
      ? { ...m, status: 'QUEUED' as ManifestStatus, sequence_order: null, route_id: null }
      : m,
  );
}

/** Success: set OPTIMIZED + sequence_order (1,2,3…) + route_id per the AI sequence. */
export function applyOptimized(qc: QueryClient, res: OptimizeResponse): void {
  const order = new Map(res.optimized_sequence.map((id, i) => [id, i + 1] as const));
  patchManifests(qc, (m) =>
    order.has(m.manifest_id)
      ? {
          ...m,
          status: 'OPTIMIZED' as ManifestStatus,
          sequence_order: order.get(m.manifest_id) ?? null,
          route_id: res.route_id,
        }
      : m,
  );
}

/** Assemble a Route object (Doc 01 §2.4) handed to Process 3/4. */
export function buildRoute(res: OptimizeResponse, payload: OptimizeRequest): Route {
  return {
    route_id: res.route_id,
    dispatcher_id: payload.dispatcher_id,
    fleet_id: payload.fleet_id,
    origin_coordinate: payload.origin_coordinate,
    optimized_sequence: res.optimized_sequence,
    waypoints: res.waypoints,
    path: res.path,
    estimated_total_duration_mins: res.estimated_total_duration_mins,
    ai_insights: res.ai_insights,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
  };
}

import type { QueryClient } from '@tanstack/react-query';
import type { Manifest, ManifestListResponse } from '@/types';
import { queryKeys } from '@/lib/query-keys';

/** Apply `fn` to every manifest across all cached `['manifests', 'list', …]` queries. */
function patchManifests(qc: QueryClient, fn: (m: Manifest) => Manifest): void {
  qc.setQueriesData<ManifestListResponse>({ queryKey: queryKeys.manifests.all }, (old) =>
    old ? { ...old, data: old.data.map(fn) } : old,
  );
}

/**
 * Success: flip manifests to DISPATCHED + populate driver/fleet fields (Doc 01 §3).
 * Mirrors applyOptimized in route-cache.ts but for the Process 3 transition.
 */
export function markDispatched(
  qc: QueryClient,
  manifestIds: string[],
  driverId: string,
  fleetId: string,
): void {
  const idSet = new Set(manifestIds);
  patchManifests(qc, (m) =>
    idSet.has(m.manifest_id)
      ? { ...m, status: 'DISPATCHED', assigned_driver_id: driverId, assigned_fleet_id: fleetId }
      : m,
  );
}

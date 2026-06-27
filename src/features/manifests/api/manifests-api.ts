import type { ManifestListResponse, ManifestQuery } from '@/types';

/** Fetch limit used by the grid — all matching rows in one shot, virtualized in the browser. */
const GRID_LIMIT = 10_000;

/**
 * GET /api/v1/manifests (Doc 01 §5.1).
 * Fetched server-side (MSW intercepts in dev). Filters are server-applied;
 * sort is passed through but TanStack Table re-sorts client-side after
 * receiving the full filtered set, so INP stays under 200 ms.
 */
export async function fetchManifests(query: ManifestQuery): Promise<ManifestListResponse> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.region) params.set('region', query.region);
  if (query.priority) params.set('priority', query.priority);
  if (query.status) params.set('status', query.status);
  if (query.cursor) params.set('cursor', String(query.cursor));
  params.set('limit', String(GRID_LIMIT));

  const res = await fetch(`/api/v1/manifests?${params.toString()}`);
  if (!res.ok) throw new Error(`manifests fetch failed: ${res.status}`);
  return res.json() as Promise<ManifestListResponse>;
}

import { http, HttpResponse } from 'msw';
import type { Manifest, ManifestListResponse, Priority } from '@/types';
import { MANIFESTS } from '../data';

/** Default page size. Pass ?limit=N (max 10 000) to override (used by the grid). */
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 10_000;

/** Lowercased fuzzy match against the fields a dispatcher would search. */
function matchesQuery(m: Manifest, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    m.manifest_id.toLowerCase().includes(needle) ||
    m.recipient_name.toLowerCase().includes(needle) ||
    m.region.toLowerCase().includes(needle)
  );
}

type SortField = keyof Pick<Manifest, 'manifest_id' | 'recipient_name' | 'region' | 'weight_kg' | 'priority' | 'status' | 'created_at'>;

const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };

function compare(a: Manifest, b: Manifest, field: SortField): number {
  if (field === 'weight_kg') return a.weight_kg - b.weight_kg;
  if (field === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  return String(a[field]).localeCompare(String(b[field]));
}

/**
 * GET /api/v1/manifests — Process 1 data ingestion (Doc 01 §5.1).
 * Server-side filter + sort + pagination. Query params:
 *   q, region, priority, status, sort ("field:asc|desc"), cursor (offset).
 * Returns { data, total } where `total` is the count AFTER filtering.
 */
export const manifestsHandler = http.get('/api/v1/manifests', ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim();
  const region = url.searchParams.get('region');
  const priority = url.searchParams.get('priority');
  const status = url.searchParams.get('status');
  const sort = url.searchParams.get('sort');
  const cursor = Number(url.searchParams.get('cursor') ?? 0) || 0;
  const limit = Math.min(Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, MAX_LIMIT);

  let rows = MANIFESTS;

  if (q) rows = rows.filter((m) => matchesQuery(m, q));
  if (region) rows = rows.filter((m) => m.region === region);
  if (priority) rows = rows.filter((m) => m.priority === priority);
  if (status) rows = rows.filter((m) => m.status === status);

  if (sort) {
    const [field, dir] = sort.split(':') as [SortField, 'asc' | 'desc'];
    const sign = dir === 'desc' ? -1 : 1;
    rows = [...rows].sort((a, b) => sign * compare(a, b, field));
  }

  const total = rows.length;
  const data = rows.slice(cursor, cursor + limit);

  const body: ManifestListResponse = { data, total };
  return HttpResponse.json(body);
});

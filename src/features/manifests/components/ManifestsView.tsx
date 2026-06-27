'use client';

import { useState, useMemo } from 'react';
import { Zap } from 'lucide-react';
import type { SortingState } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { useSelectionStore } from '@/stores/selection-store';
import type { ManifestStatus, Priority } from '@/types';
import { STATUS_CONFIG } from '@/config/status';
import { cn } from '@/lib/utils';
import { Can } from '@/components/rbac/Can';
import { OptimizeDrawer } from '@/features/optimize';
import { AssignDriverModal, type AssignDriverContext } from '@/features/dispatch';
import { useManifests } from '../hooks/useManifests';
import { FilterToolbar, type FilterState } from './FilterToolbar';
import { ManifestDataGrid } from './ManifestDataGrid';

// ── Summary stat cards ────────────────────────────────────────────────────
const SUMMARY_STATUSES: { status: ManifestStatus; label: string }[] = [
  { status: 'IN_TRANSIT', label: 'In Transit' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'DISPATCHED', label: 'Dispatched' },
  { status: 'EXCEPTION', label: 'Exception' },
];

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex min-w-32.5 flex-1 items-center gap-3 rounded-[13px] border border-border bg-surface-1 px-4 py-3">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
        <div className="mt-0.5 font-display text-[18px] font-bold leading-none text-text-primary">
          {count.toLocaleString('en-US')}
        </div>
      </div>
    </div>
  );
}

// ── View ──────────────────────────────────────────────────────────────────
export function ManifestsView() {
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    region: '',
    priority: '',
    status: '',
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'manifest_id', desc: false }]);
  // Incremented on full filter reset so FilterToolbar remounts and reinitialises
  // its local inputQ from the (now-empty) filters.q — avoids a sync setState effect.
  const [resetKey, setResetKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignCtx, setAssignCtx] = useState<AssignDriverContext | null>(null);

  const selectedIds = useSelectionStore((s) => s.selectedIds);

  const query = useMemo(
    () => ({
      q: filters.q || undefined,
      region: filters.region || undefined,
      priority: (filters.priority as Priority) || undefined,
      status: (filters.status as ManifestStatus) || undefined,
    }),
    [filters],
  );

  const { data, isLoading, isFetching, isError, refetch } = useManifests(query);
  const manifests = data?.data ?? []; // stable alias used by the grid
  const total = data?.total ?? 0;

  // Summary counts derived from the fetched dataset; depend on `data` (stable reference).
  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ManifestStatus, number>> = {};
    for (const m of (data?.data ?? [])) counts[m.status] = (counts[m.status] ?? 0) + 1;
    return counts;
  }, [data]);

  const hasFilters = !!(filters.q || filters.region || filters.priority || filters.status);

  // Resolve selected ids → full Manifest objects for the optimize drawer.
  // Depends on stable `data` (not the per-render `manifests` alias).
  const selectedManifests = useMemo(() => {
    const set = new Set(selectedIds);
    return (data?.data ?? []).filter((m) => set.has(m.manifest_id));
  }, [data, selectedIds]);

  const handleOptimize = () => {
    if (selectedIds.length > 0) setDrawerOpen(true);
  };

  const handleFilterChange = (patch: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const handleClearFilters = () => {
    setFilters({ q: '', region: '', priority: '', status: '' });
    setResetKey((k) => k + 1); // remount FilterToolbar so its inputQ reinitialises
  };

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col gap-4 overflow-hidden p-5 animate-fade-up">
      <PageHeader
        title="Manifest Grid"
        meta={`${total > 0 ? total.toLocaleString('en-US') : '10,000'} records · compact density · Bali region`}
        actions={
          <Can permission="route:optimize">
            <button
              onClick={handleOptimize}
              disabled={selectedIds.length === 0}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-all',
                selectedIds.length > 0
                  ? 'cursor-pointer bg-accent text-white shadow-[0_2px_8px_rgba(30,138,99,0.3)] hover:bg-accent-hover'
                  : 'cursor-not-allowed border border-border bg-surface-2 text-text-muted opacity-50',
              )}
            >
              <Zap className="h-3.5 w-3.5" fill={selectedIds.length > 0 ? 'currentColor' : 'none'} />
              Optimize Selected
              {selectedIds.length > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-px font-mono text-[10px] font-bold">
                  {selectedIds.length}
                </span>
              )}
            </button>
          </Can>
        }
      />

      {/* Summary stat cards */}
      <div className="flex gap-3 overflow-x-auto pb-0.5">
        <div className="flex min-w-32.5 flex-1 items-center gap-3 rounded-[13px] border border-border bg-surface-1 px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-text-muted" />
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-wide text-text-muted">Total</div>
            <div className="mt-0.5 font-display text-[18px] font-bold leading-none text-text-primary">
              {isLoading ? '—' : total.toLocaleString('en-US')}
            </div>
          </div>
        </div>
        {SUMMARY_STATUSES.map(({ status, label }) => (
          <StatCard
            key={status}
            label={label}
            count={isLoading ? 0 : (statusCounts[status] ?? 0)}
            color={STATUS_CONFIG[status].text}
          />
        ))}
      </div>

      {/* Table card */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface-1">
        <FilterToolbar
          key={resetKey}
          filters={filters}
          onFilterChange={handleFilterChange}
          total={total}
          selectedCount={selectedIds.length}
          onOptimize={handleOptimize}
        />
        <ManifestDataGrid
          data={manifests}
          total={total}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          onRetry={() => refetch()}
          sorting={sorting}
          onSortingChange={setSorting}
          onClearFilters={handleClearFilters}
          hasFilters={hasFilters}
        />
      </div>

      <OptimizeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedManifests={selectedManifests}
        onAssignDriver={(ctx) => {
          setDrawerOpen(false);
          setAssignCtx(ctx);
        }}
      />

      {assignCtx && (
        <AssignDriverModal
          open={assignCtx !== null}
          onClose={() => setAssignCtx(null)}
          ctx={assignCtx}
        />
      )}
    </div>
  );
}

'use client';

import { useRef, useMemo, memo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, AlertTriangle } from 'lucide-react';
import type { Manifest, Priority } from '@/types';
import { useSelectionStore } from '@/stores/selection-store';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityChip } from '@/components/shared/PriorityChip';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { formatWeight } from '@/lib/format';
import { cn } from '@/lib/utils';

const ROW_HEIGHT = 32; // compact density (design system)
const OVERSCAN = 8;

const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };

const col = createColumnHelper<Manifest>();

// ── Skeleton loading rows ──────────────────────────────────────────────────
const SKEL_WIDTHS = [
  ['64px', '160px', '90px', '38px', '38px', '68px'],
  ['68px', '140px', '72px', '38px', '38px', '68px'],
  ['64px', '180px', '80px', '38px', '38px', '68px'],
  ['68px', '120px', '96px', '38px', '38px', '68px'],
  ['64px', '152px', '68px', '38px', '38px', '68px'],
  ['68px', '168px', '84px', '38px', '38px', '68px'],
  ['64px', '136px', '76px', '38px', '38px', '68px'],
  ['68px', '178px', '88px', '38px', '38px', '68px'],
  ['64px', '148px', '72px', '38px', '38px', '68px'],
  ['68px', '162px', '80px', '38px', '38px', '68px'],
  ['64px', '144px', '92px', '38px', '38px', '68px'],
  ['68px', '172px', '76px', '38px', '38px', '68px'],
];

function SkeletonRows() {
  return (
    <>
      {SKEL_WIDTHS.map((widths, ri) => (
        <tr key={ri} className="border-t border-border-subtle" style={{ height: ROW_HEIGHT }}>
          <td className="sticky left-0 z-1 bg-surface-1 px-3">
            <div className="mx-auto h-3.5 w-3.5 animate-shimmer rounded-[3px]" />
          </td>
          <td className="sticky left-9 z-1 border-r border-border-subtle bg-surface-1 px-3">
            <div className="h-2 animate-shimmer rounded" style={{ width: widths[0] }} />
          </td>
          <td className="px-3"><div className="h-2 animate-shimmer rounded" style={{ width: widths[1] }} /></td>
          <td className="px-3"><div className="h-2 animate-shimmer rounded" style={{ width: widths[2] }} /></td>
          <td className="px-3"><div className="h-4 w-10 animate-shimmer rounded-[5px]" /></td>
          <td className="px-3 text-right"><div className="ml-auto h-2 w-12 animate-shimmer rounded" /></td>
          <td className="px-3"><div className="h-4 w-16 animate-shimmer rounded-[5px]" /></td>
        </tr>
      ))}
    </>
  );
}

// ── Sort icon helper ───────────────────────────────────────────────────────
function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="h-3 w-3 shrink-0" />;
  if (sorted === 'desc') return <ArrowDown className="h-3 w-3 shrink-0" />;
  return <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" />;
}

// ── Column definitions ─────────────────────────────────────────────────────
// Selection state is injected via the row click handler rather than column
// meta, so column defs don't need to import Zustand directly.

function buildColumns(
  selectedSet: Set<string>,
  toggleOne: (id: string) => void,
  togglePage: (ids: string[], all: boolean) => void,
) {
  return [
    col.display({
      id: 'select',
      size: 38,
      enableSorting: false,
      header: ({ table }) => {
        const ids = table.getRowModel().rows.map((r) => r.original.manifest_id);
        const allSel = ids.length > 0 && ids.every((id) => selectedSet.has(id));
        const someSel = !allSel && ids.some((id) => selectedSet.has(id));
        return (
          <th className="sticky left-0 z-20 w-9 bg-surface-1 px-3 py-2">
            <span onClick={() => togglePage(ids, !allSel)} className="block cursor-pointer">
              <Checkbox checked={allSel} indeterminate={someSel} className="mx-auto" />
            </span>
          </th>
        );
      },
      cell: ({ row }) => {
        const id = row.original.manifest_id;
        const checked = selectedSet.has(id);
        return (
          <td
            onClick={() => toggleOne(id)}
            className={cn('sticky left-0 z-10 cursor-pointer px-3 py-0', checked ? 'bg-surface-3' : 'bg-surface-1')}
          >
            <Checkbox checked={checked} className="mx-auto" />
          </td>
        );
      },
    }),
    col.accessor('manifest_id', {
      id: 'manifest_id',
      size: 130,
      header: (ctx) => (
        <th
          className="sticky left-9 z-20 cursor-pointer select-none bg-surface-1 px-3 py-2 text-left"
          onClick={ctx.column.getToggleSortingHandler()}
        >
          <span className="flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-text-muted">
            MNF-ID <SortIcon sorted={ctx.column.getIsSorted()} />
          </span>
        </th>
      ),
      cell: ({ row }) => {
        const id = row.original.manifest_id;
        const checked = selectedSet.has(id);
        return (
          <td
            className={cn(
              'sticky left-9 z-10 cursor-pointer border-r border-border-subtle px-3 py-0',
              'whitespace-nowrap font-mono text-[11.5px] font-semibold',
              checked ? 'bg-surface-3 text-accent-bright' : 'bg-surface-1 text-text-secondary',
            )}
            onClick={() => toggleOne(id)}
          >
            {id}
          </td>
        );
      },
    }),
    col.accessor('recipient_name', {
      id: 'recipient_name',
      size: 220,
      header: (ctx) => (
        <th className="cursor-pointer select-none px-3 py-2 text-left" onClick={ctx.column.getToggleSortingHandler()}>
          <span className="flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-text-muted">
            Recipient <SortIcon sorted={ctx.column.getIsSorted()} />
          </span>
        </th>
      ),
      cell: ({ getValue }) => (
        <td className="max-w-55 truncate px-3 py-0 text-xs text-text-secondary">{getValue()}</td>
      ),
    }),
    col.accessor('region', {
      id: 'region',
      size: 140,
      header: (ctx) => (
        <th className="cursor-pointer select-none px-3 py-2 text-left" onClick={ctx.column.getToggleSortingHandler()}>
          <span className="flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-text-muted">
            Region <SortIcon sorted={ctx.column.getIsSorted()} />
          </span>
        </th>
      ),
      cell: ({ getValue }) => (
        <td className="whitespace-nowrap px-3 py-0 text-[11.5px] text-text-muted">{getValue()}</td>
      ),
    }),
    col.accessor('priority', {
      id: 'priority',
      size: 110,
      sortingFn: (a, b) => PRIORITY_RANK[a.original.priority] - PRIORITY_RANK[b.original.priority],
      header: (ctx) => (
        <th className="cursor-pointer select-none px-3 py-2 text-left" onClick={ctx.column.getToggleSortingHandler()}>
          <span className="flex items-center gap-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-text-muted">
            Priority <SortIcon sorted={ctx.column.getIsSorted()} />
          </span>
        </th>
      ),
      cell: ({ getValue }) => (
        <td className="px-3 py-0"><PriorityChip priority={getValue()} /></td>
      ),
    }),
    col.accessor('weight_kg', {
      id: 'weight_kg',
      size: 110,
      header: (ctx) => (
        <th className="cursor-pointer select-none px-3 py-2 text-right" onClick={ctx.column.getToggleSortingHandler()}>
          <span className="flex items-center justify-end gap-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-text-muted">
            Weight (kg) <SortIcon sorted={ctx.column.getIsSorted()} />
          </span>
        </th>
      ),
      cell: ({ getValue }) => (
        <td className="whitespace-nowrap px-3 py-0 text-right font-mono text-[11.5px] text-text-secondary">
          {formatWeight(getValue())}
        </td>
      ),
    }),
    col.accessor('status', {
      id: 'status',
      size: 130,
      enableSorting: false,
      header: () => (
        <th className="px-3 py-2 text-left">
          <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-text-muted">Status</span>
        </th>
      ),
      cell: ({ getValue }) => (
        <td className="px-3 py-0"><StatusBadge status={getValue()} /></td>
      ),
    }),
  ];
}

// ── Memoized row ───────────────────────────────────────────────────────────
// Only the ~20–30 virtualized rows are in the DOM, but selection churn (clicking
// rows / select-all) re-renders the grid. React.memo keyed on this row's own
// `selected` flag + its stable `row.original` reference means a single-row click
// re-renders just that row, not every visible one — protecting INP (SDD §10).
const GridRow = memo(
  function GridRow({ row, selected }: { row: Row<Manifest>; selected: boolean }) {
    return (
      <tr
        style={{ height: ROW_HEIGHT }}
        className={cn(
          'border-t border-border-subtle transition-colors hover:bg-surface-2/40',
          selected && 'bg-accent/[0.07]',
        )}
      >
        {row.getVisibleCells().map((cell) => flexRender(cell.column.columnDef.cell, cell.getContext()))}
      </tr>
    );
  },
  (prev, next) => prev.selected === next.selected && prev.row.original === next.row.original,
);

// ── Main component ─────────────────────────────────────────────────────────

interface ManifestDataGridProps {
  data: Manifest[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError?: boolean;
  onRetry?: () => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function ManifestDataGrid({
  data,
  total,
  isLoading,
  isFetching,
  isError = false,
  onRetry,
  sorting,
  onSortingChange,
  onClearFilters,
  hasFilters,
}: ManifestDataGridProps) {
  const { selectedIds, toggle, setMany } = useSelectionStore();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const togglePage = (ids: string[], select: boolean) => setMany(ids, select);

  const columns = useMemo(
    () => buildColumns(selectedSet, toggle, togglePage),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSet],
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- known TanStack Table limitation with React Compiler; safe to ignore
  const table = useReactTable({
    data,
    columns: columns as never,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    defaultColumn: { size: 120, minSize: 60 },
  });

  const rows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0;

  const displayStart = total > 0 ? 1 : 0;
  const displayEnd = Math.min(data.length, total);

  // ── Empty / error states ───────────────────────────────────────────────────
  const showError = isError && data.length === 0;
  const isEmpty = !isLoading && !showError && data.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Bulk-selection info bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between border-b border-accent/25 bg-accent/[0.07] px-3.5 py-1.5">
          <span className="text-[11.5px] font-semibold text-accent-bright">
            {selectedIds.length} row{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => useSelectionStore.getState().clear()}
            className="text-[10.5px] text-text-muted hover:text-text-secondary"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Scrollable table */}
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 overflow-x-auto overflow-y-auto',
          isFetching && !isLoading && 'opacity-70 transition-opacity',
        )}
      >
        <table className="w-full min-w-205 border-collapse">
          {/* ── Header (sticky top) ── */}
          <thead className="sticky top-0 z-15">
            <tr className="border-b border-border bg-surface-1">
              {table.getHeaderGroups()[0].headers.map((header) =>
                flexRender(header.column.columnDef.header, header.getContext()),
              )}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : showError ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-error/30 bg-error/12">
                      <AlertTriangle className="h-5 w-5 text-[#F87171]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-text-secondary">Couldn’t load manifests</p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        The manifest service didn’t respond. Check your connection and try again.
                      </p>
                    </div>
                    {onRetry && (
                      <Button variant="secondary" onClick={onRetry}>
                        Retry
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center gap-3 py-16">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-2">
                      <Search className="h-5 w-5 text-text-muted" />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-text-secondary">No manifests found</p>
                      <p className="mt-1 text-[11px] text-text-muted">
                        Try adjusting the region filter or clearing your search term.
                      </p>
                    </div>
                    {hasFilters && (
                      <Button variant="secondary" onClick={onClearFilters}>
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {/* Top spacer — fakes height of unrendered rows above viewport */}
                {paddingTop > 0 && (
                  <tr style={{ height: paddingTop }}>
                    <td colSpan={7} />
                  </tr>
                )}

                {virtualItems.map((vi) => {
                  const row = rows[vi.index];
                  return (
                    <GridRow
                      key={row.id}
                      row={row}
                      selected={selectedSet.has(row.original.manifest_id)}
                    />
                  );
                })}

                {/* Bottom spacer — fakes height of unrendered rows below viewport */}
                {paddingBottom > 0 && (
                  <tr style={{ height: paddingBottom }}>
                    <td colSpan={7} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border-subtle bg-surface-0/40 px-3.5 py-2">
        <span className="font-mono text-[11px] text-text-muted">
          {isLoading
            ? 'Loading…'
            : isEmpty
              ? `Showing 0 of ${total.toLocaleString('en-US')}`
              : `Showing ${displayStart}–${displayEnd.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wide text-text-muted">Virtual scroll</span>
            <div className="h-0.75 w-18 overflow-hidden rounded-full bg-border">
              <div
                className="h-full min-w-1 rounded-full bg-accent transition-all"
                style={{ width: `${total > 0 ? Math.max(0.5, (displayEnd / total) * 100).toFixed(1) : 0}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-text-muted">
              {total > 0 ? `${((displayEnd / total) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          {selectedIds.length > 0 && (
            <span className="font-mono text-[11px] font-semibold text-accent-bright">
              {selectedIds.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { ChevronDown, Filter, Zap } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityChip } from '@/components/shared/PriorityChip';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { SearchField } from '@/components/ui/SearchField';
import { formatWeight } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PRESELECTED_IDS, SAMPLE_MANIFESTS } from '../sample-data';

const COLUMNS = ['MNF-ID', 'Recipient', 'Region', 'Priority', 'Weight (kg)', 'Status'];
const selectedCount = PRESELECTED_IDS.length;

/**
 * Process 1 — Manifests grid (static wireframe, pixel-faithful to
 * "Manifests Screen.dc.html" state 01). Hardcoded data; virtualization +
 * real filtering arrive in Phase 1.
 */
export function ManifestsView() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-fade-up">
      <PageHeader
        title="Manifest Grid"
        meta="10,000 records · compact density · Bali region"
        actions={
          <>
            <Button variant="secondary">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
            <Button variant="primary">
              <Zap className="h-3.5 w-3.5" fill="currentColor" /> Optimize Selected
              <span className="rounded-full bg-white/20 px-1.5 py-px font-mono text-[10px] font-bold">
                {selectedCount}
              </span>
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-0/40 px-3.5 py-2.5">
          <SearchField placeholder="Search manifest ID / recipient…" className="min-w-[200px] max-w-[320px] flex-1" />
          {['Region', 'Priority', 'Status'].map((f) => (
            <button
              key={f}
              className="flex h-[34px] items-center gap-1.5 rounded-lg border border-border bg-surface-0/40 px-3 text-[11.5px] text-text-secondary hover:bg-surface-2"
            >
              {f}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          ))}
          <span className="ml-auto font-mono text-[11px] text-text-muted">10,000 manifests</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-0/40">
                <th className="sticky left-0 z-[2] w-9 bg-surface-1 px-3 py-2.5">
                  <Checkbox indeterminate className="mx-auto" />
                </th>
                {COLUMNS.map((c, i) => (
                  <th
                    key={c}
                    className={cn(
                      'cursor-pointer px-3 py-2.5 text-[9.5px] font-bold uppercase tracking-wider text-text-muted',
                      c === 'Weight (kg)' ? 'text-right' : 'text-left',
                      i === 0 && 'sticky left-9 z-[2] bg-surface-1',
                    )}
                  >
                    {c}
                    {i === 0 && <span className="text-text-secondary"> ↑</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_MANIFESTS.map((m) => {
                const selected = PRESELECTED_IDS.includes(m.id);
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      'border-t border-border-subtle transition-colors hover:bg-surface-2/60',
                      selected && 'bg-accent/[0.08]',
                    )}
                  >
                    <td
                      className={cn('sticky left-0 z-[1] px-3 py-[7px]', selected ? 'bg-surface-3' : 'bg-surface-1')}
                    >
                      <Checkbox checked={selected} className="mx-auto" />
                    </td>
                    <td
                      className={cn(
                        'sticky left-9 z-[1] whitespace-nowrap px-3 py-[7px] font-mono text-[11.5px] font-semibold',
                        selected ? 'bg-surface-3 text-accent-bright' : 'bg-surface-1 text-text-secondary',
                      )}
                    >
                      {m.id}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-[7px] text-xs text-text-secondary">{m.recipient}</td>
                    <td className="whitespace-nowrap px-3 py-[7px] text-[11.5px] text-text-muted">{m.region}</td>
                    <td className="px-3 py-[7px]">
                      <PriorityChip priority={m.priority} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-[7px] text-right font-mono text-[11.5px] text-text-secondary">
                      {formatWeight(m.weight)}
                    </td>
                    <td className="px-3 py-[7px]">
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface-0/40 px-3.5 py-2.5">
          <span className="font-mono text-[11px] text-text-muted">Showing 1–15 of 10,000</span>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] uppercase tracking-wide text-text-muted">Virtual scroll</span>
              <div className="h-[3px] w-[72px] overflow-hidden rounded-full bg-border">
                <div className="h-full w-[6%] rounded-full bg-accent" />
              </div>
              <span className="font-mono text-[9px] text-text-muted">0.2%</span>
            </div>
            <div className="flex gap-1">
              {['1', '2', '3', '4'].map((p) => (
                <button
                  key={p}
                  className={cn(
                    'flex h-[26px] min-w-[26px] items-center justify-center rounded-md px-1.5 text-[11px]',
                    p === '1'
                      ? 'bg-accent font-bold text-white'
                      : 'border border-border text-text-muted hover:bg-surface-2',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

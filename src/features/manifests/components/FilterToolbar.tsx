'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { SearchField } from '@/components/ui/SearchField';
import { cn } from '@/lib/utils';
import { MANIFEST_STATUSES, PRIORITIES } from '@/types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/config/status';

const REGIONS = [
  'Denpasar Utara', 'Denpasar Selatan', 'Denpasar Timur',
  'Kuta', 'Seminyak', 'Ubud', 'Sanur', 'Gianyar',
  'Jimbaran', 'Canggu', 'Nusa Dua', 'Benoa', 'Klungkung', 'Padang Bai',
] as const;

export interface FilterState {
  q: string;
  region: string;
  priority: string;
  status: string;
}

interface FilterToolbarProps {
  filters: FilterState;
  onFilterChange: (patch: Partial<FilterState>) => void;
  total: number;
  selectedCount: number;
  onOptimize: () => void;
}

/** Styled native <select> wrapper matching the prototype's filter dropdown appearance. */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const active = !!value;
  return (
    <div className="relative flex h-8.5 items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-full appearance-none rounded-lg border pr-7 pl-3 text-[11.5px] font-medium',
          'cursor-pointer bg-surface-0 outline-none transition-colors',
          active
            ? 'border-accent/40 bg-accent/8 text-accent-bright'
            : 'border-border text-text-secondary hover:bg-surface-2',
        )}
      >
        <option value="">{label}</option>
        {children}
      </select>
      <ChevronDown
        className={cn(
          'pointer-events-none absolute right-2 h-3 w-3',
          active ? 'text-accent-bright' : 'text-text-muted',
        )}
      />
      {active && (
        <span className="pointer-events-none absolute right-6 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent-bright" />
      )}
    </div>
  );
}

/**
 * Toolbar for the manifests grid (Process 1).
 *
 * `inputQ` is local state so the search field feels instant; after 250 ms the
 * debounce fires `onFilterChange({ q })` which updates the TanStack Query key.
 * There is NO sync effect — instead the parent remounts this component (via
 * `key={resetKey}`) when a full filter reset is needed, so `inputQ` reinitialises
 * cleanly from the `filters.q` initial prop without a cascading setState effect.
 */
export function FilterToolbar({ filters, onFilterChange, total, selectedCount, onOptimize }: FilterToolbarProps) {
  const [inputQ, setInputQ] = useState(filters.q);

  // Debounce: wait 250 ms after the last keystroke before updating the query key.
  useEffect(() => {
    const t = setTimeout(() => onFilterChange({ q: inputQ }), 250);
    return () => clearTimeout(t);
  }, [inputQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use inputQ for the q check so Reset appears immediately on first keystroke.
  const hasFilters = !!(inputQ || filters.region || filters.priority || filters.status);
  const canOptimize = selectedCount > 0;

  const resetAll = () => {
    setInputQ('');
    onFilterChange({ q: '', region: '', priority: '', status: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-0/40 px-3.5 py-2.5">
      <SearchField
        placeholder="Search manifest ID / recipient…"
        value={inputQ}
        onChange={setInputQ}
        className="min-w-50 max-w-75 flex-1"
      />

      <FilterSelect label="Region" value={filters.region} onChange={(v) => onFilterChange({ region: v })}>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </FilterSelect>

      <FilterSelect label="Priority" value={filters.priority} onChange={(v) => onFilterChange({ priority: v })}>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
        ))}
      </FilterSelect>

      <FilterSelect label="Status" value={filters.status} onChange={(v) => onFilterChange({ status: v })}>
        {MANIFEST_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
        ))}
      </FilterSelect>

      {hasFilters && (
        <button
          onClick={resetAll}
          className="h-8.5 rounded-lg border border-border px-3 text-[11px] text-text-muted hover:bg-surface-2"
        >
          Reset
        </button>
      )}

      <span className="ml-auto font-mono text-[11px] text-text-muted">
        {total.toLocaleString('en-US')} manifests
      </span>

      <button
        onClick={canOptimize ? onOptimize : undefined}
        disabled={!canOptimize}
        className={cn(
          'flex h-8.5 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold transition-all',
          canOptimize
            ? 'cursor-pointer border-none bg-accent text-white shadow-[0_2px_8px_rgba(30,138,99,0.3)] hover:bg-accent-hover'
            : 'cursor-not-allowed border border-border bg-surface-2 text-text-muted opacity-50',
        )}
      >
        <Zap className="h-3.5 w-3.5 shrink-0" fill={canOptimize ? 'currentColor' : 'none'} />
        Optimize Route
        {canOptimize && (
          <span className="rounded-full bg-white/20 px-1.5 py-px font-mono text-[10px] font-bold">
            {selectedCount}
          </span>
        )}
      </button>
    </div>
  );
}

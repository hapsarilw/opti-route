'use client';

import type { MonitoredFleet } from '@/types';
import { cn } from '@/lib/utils';
import { MONITOR_STATUS } from '../lib/status';

interface FleetPanelProps {
  fleets: MonitoredFleet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRouteCount: number;
  exceptionCount: number;
}

/**
 * Left "Live Fleet" panel (Doc 02 §4). Lists active vehicles with status, driver,
 * ETA + speed. Clicking a row pans the map to that vehicle (via `onSelect`).
 */
export function FleetPanel({ fleets, selectedId, onSelect, onRouteCount, exceptionCount }: FleetPanelProps) {
  return (
    <div className="glass-panel absolute left-4 top-4 z-[15] flex max-h-[calc(100%-32px)] w-[280px] flex-col overflow-hidden rounded-xl border border-border shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-3.5 py-2.5">
        <div>
          <div className="font-display text-[12.5px] font-bold text-text-primary">Live Fleet</div>
          <div className="mt-px font-mono text-[10px] text-text-muted">
            {onRouteCount} on-route · {exceptionCount} alert
          </div>
        </div>
        {exceptionCount > 0 && (
          <span className="rounded-full border border-error/25 bg-error/12 px-2 py-0.5 font-mono text-[9.5px] font-bold text-[#F87171]">
            {exceptionCount} EXC
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {fleets.map((f) => {
          const s = MONITOR_STATUS[f.status];
          const selected = f.fleet_id === selectedId;
          return (
            <button
              key={f.fleet_id}
              onClick={() => onSelect(f.fleet_id)}
              className={cn(
                'flex w-full items-center gap-2.5 border-t border-border-subtle px-3.5 py-2.5 text-left transition-colors',
                selected ? 'bg-route/10' : 'hover:bg-white/[0.03]',
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={cn(
                      'font-mono text-[11.5px] font-bold',
                      selected ? 'text-route' : 'text-text-secondary',
                    )}
                  >
                    {f.fleet_id}
                  </span>
                  <span
                    className="shrink-0 rounded px-1.5 py-px text-[9.5px] font-semibold"
                    style={{ color: s.color, background: `${s.color}22`, border: `1px solid ${s.color}40` }}
                  >
                    {s.label}
                  </span>
                </div>
                <div className="truncate text-[11px] text-text-secondary">{f.driver_name}</div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-text-muted">
                  <span>ETA {f.eta}</span>
                  {f.speed_kmh > 0 && <span>{f.speed_kmh} km/h</span>}
                </div>
              </div>
              {selected && <div className="h-8 w-[2.5px] shrink-0 rounded-full bg-route" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

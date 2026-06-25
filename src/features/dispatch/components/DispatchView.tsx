import { Truck, MapPin, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const DRIVERS = [
  { id: 'DRV-04', name: 'Made Suparta', dist: 1.8 },
  { id: 'DRV-11', name: 'Wayan Gunawan', dist: 2.4 },
  { id: 'DRV-07', name: 'Komang Aditya', dist: 3.7 },
  { id: 'DRV-02', name: 'Ketut Mahendra', dist: 5.1 },
  { id: 'DRV-19', name: 'Putu Indra', dist: 6.9 },
];
const SELECTED_ID = 'DRV-04';
const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const STATS = [
  { icon: Truck, label: 'Fleet', value: 'Box L300', accent: false },
  { icon: MapPin, label: 'Stop', value: '5 stops', accent: false },
  { icon: Clock, label: 'ETA', value: '3h 42m', accent: true },
];

/**
 * Process 3 — Assign Driver modal (static wireframe of "Assign Driver Modal.dc.html"
 * select state). Nearest-driver Haversine ranking + dispatch land in Phase 3.
 */
export function DispatchView() {
  return (
    <div className="relative h-[calc(100vh-52px)] overflow-hidden">
      {/* Dimmed dispatch backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,var(--surface-1),var(--surface-0)_70%)]" />
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />

      {/* Modal */}
      <div className="absolute inset-0 z-30 flex items-center justify-center p-6">
        <div className="flex max-h-[calc(100vh-96px)] w-[452px] max-w-full flex-col overflow-hidden rounded-[18px] border border-border bg-surface-1 shadow-[0_24px_70px_rgba(0,0,0,0.6)] animate-fade-up">
          {/* Header */}
          <div className="border-b border-border bg-gradient-to-b from-[#A855F7]/[0.06] to-transparent p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#C084FC]/30 bg-[#C084FC]/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-[#C084FC]">
                <span className="h-[5px] w-[5px] rounded-full bg-[#C084FC]" /> ROUTE OPTIMIZED
              </span>
              <button className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="font-display text-[21px] font-bold tracking-[-0.4px] text-text-primary">Assign Driver</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Select a driver for route{' '}
              <span className="font-mono font-semibold text-text-secondary">MNF-240007</span> · Gianyar Loop
            </p>
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-[10px] border border-border bg-surface-0 px-2.5 py-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Icon className={cn('h-3 w-3', s.accent ? 'text-accent-bright' : 'text-text-secondary')} />
                      <span className="font-mono text-[8.5px] font-bold uppercase tracking-wide text-text-muted">{s.label}</span>
                    </div>
                    <div className={cn('font-display text-[13.5px] font-bold', s.accent ? 'text-accent-bright' : 'text-text-primary')}>
                      {s.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver list */}
          <div className="flex items-center justify-between px-5 pb-1 pt-3.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-text-muted">Available drivers · nearest ↓</span>
            <span className="font-mono text-[10.5px] text-text-muted">{DRIVERS.length} available</span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto px-3.5 pb-2.5 pt-1.5">
            {DRIVERS.map((d, i) => {
              const selected = d.id === SELECTED_ID;
              return (
                <div
                  key={d.id}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                    selected ? 'border-accent/45 bg-accent/10' : 'border-border-subtle hover:bg-surface-2/60',
                  )}
                >
                  <div
                    className={cn(
                      'relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border font-display text-[12.5px] font-bold',
                      selected ? 'border-accent/40 bg-accent/20 text-accent-bright' : 'border-border bg-surface-2 text-text-secondary',
                    )}
                  >
                    {initials(d.name)}
                    <span className="absolute -bottom-0.5 -right-0.5 h-[11px] w-[11px] rounded-full border-2 border-surface-1 bg-accent-bright" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-bold text-text-primary">{d.name}</span>
                      {i === 0 && (
                        <span className="rounded bg-accent-bright px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-surface-0">
                          Nearest
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-bright" />
                        <span className="font-mono text-[10px] font-semibold text-accent-bright">AVAILABLE</span>
                      </span>
                      <span className="text-[11.5px] text-text-secondary">{d.dist.toFixed(1)} km from warehouse</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      selected ? 'border-accent' : 'border-surface-3',
                    )}
                  >
                    {selected && <span className="h-[9px] w-[9px] rounded-full bg-accent" />}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2.5 border-t border-border bg-surface-0 px-5 py-3.5">
            <div className="min-w-0 flex-1 text-[11px] text-text-muted">
              Dispatch to <span className="font-semibold text-text-secondary">Made Suparta</span>
            </div>
            <Button variant="ghost">Cancel</Button>
            <Button variant="primary">Dispatch</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

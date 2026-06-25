import { Plus, Minus, LocateFixed, Layers } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';

type FleetState = 'IN_TRANSIT' | 'DELAYED' | 'EXCEPTION' | 'DISPATCHED';

const FLEET_COLORS: Record<FleetState, { label: string; color: string }> = {
  IN_TRANSIT: { label: 'In Transit', color: '#4ADE80' },
  DELAYED: { label: 'Delayed', color: '#FBBF24' },
  EXCEPTION: { label: 'Exception', color: '#F87171' },
  DISPATCHED: { label: 'Dispatched', color: '#2DD4BF' },
};

const FLEET: { id: string; driver: string; state: FleetState; eta: string; speed: number; selected?: boolean }[] = [
  { id: 'FLT-001', driver: 'Budi Santoso', state: 'IN_TRANSIT', eta: '14:30', speed: 62 },
  { id: 'FLT-002', driver: 'Ahmad Fauzi', state: 'DELAYED', eta: '16:45', speed: 8 },
  { id: 'FLT-003', driver: 'Dewi Rahayu', state: 'IN_TRANSIT', eta: '13:45', speed: 74, selected: true },
  { id: 'FLT-004', driver: 'Rizky Pratama', state: 'IN_TRANSIT', eta: '15:00', speed: 55 },
  { id: 'FLT-005', driver: 'Hendra Wijaya', state: 'EXCEPTION', eta: 'TBD', speed: 0 },
  { id: 'FLT-006', driver: 'Agus Salim', state: 'DISPATCHED', eta: '16:00', speed: 44 },
  { id: 'FLT-007', driver: 'Nurul Hidayat', state: 'EXCEPTION', eta: 'TBD', speed: 0 },
];

const LEGEND = [
  { label: 'In Transit', color: '#4ADE80' },
  { label: 'Delayed', color: '#FBBF24' },
  { label: 'Exception', color: '#F87171' },
  { label: 'Dispatched', color: '#2DD4BF' },
  { label: 'Parked', color: '#7A8A80' },
];

/** Stylized placeholder for the Mapbox canvas (Phase 4). */
function MapPlaceholder() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 810" preserveAspectRatio="xMidYMid slice">
      <rect width={1440} height={810} fill="var(--surface-0)" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 96} y1={0} x2={i * 96} y2={810} stroke="var(--border)" strokeWidth={0.5} opacity={0.5} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 100} x2={1440} y2={i * 100} stroke="var(--border)" strokeWidth={0.5} opacity={0.5} />
      ))}
      {/* Bali-ish landmass */}
      <polygon
        points="300,250 700,210 1050,230 1240,340 1180,520 980,640 760,660 560,560 360,470 300,360"
        fill="var(--surface-1)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />
      {/* Active AI route */}
      <polyline
        points="980,300 980,360 980,540 820,600"
        fill="none"
        stroke="var(--route)"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
      />
      {[
        { x: 980, y: 360, c: '#4ADE80' },
        { x: 980, y: 540, c: '#22D3EE' },
        { x: 820, y: 600, c: '#22D3EE' },
        { x: 620, y: 430, c: '#FBBF24' },
        { x: 760, y: 520, c: '#F87171' },
      ].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={9} fill={d.c} stroke="var(--surface-0)" strokeWidth={3} />
      ))}
      <text x={720} y={780} textAnchor="middle" fontSize={12} fill="var(--text-muted)" fontFamily="monospace">
        Mapbox GL JS · WebGL fleet layer — Phase 4
      </text>
    </svg>
  );
}

export function LiveMapView() {
  const exceptionCount = FLEET.filter((f) => f.state === 'EXCEPTION').length;

  return (
    <div className="relative h-[calc(100vh-52px)] overflow-hidden animate-fade-up">
      <MapPlaceholder />

      {/* Left fleet panel */}
      <div className="glass-panel absolute left-4 top-4 z-[15] w-[280px] overflow-hidden rounded-xl border border-border shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-border-subtle px-3.5 py-2.5">
          <div>
            <div className="font-display text-[12.5px] font-bold text-text-primary">Live Fleet</div>
            <div className="mt-px font-mono text-[10px] text-text-muted">{FLEET.length} on-route · {exceptionCount} alert</div>
          </div>
          {exceptionCount > 0 && (
            <span className="rounded-full border border-error/25 bg-error/12 px-2 py-0.5 font-mono text-[9.5px] font-bold text-[#F87171]">
              {exceptionCount} EXC
            </span>
          )}
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
          {FLEET.map((f) => {
            const c = FLEET_COLORS[f.state];
            return (
              <div
                key={f.id}
                className={cn(
                  'flex items-center gap-2.5 border-t border-border-subtle px-3.5 py-2.5',
                  f.selected && 'bg-route/10',
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={cn('font-mono text-[11.5px] font-bold', f.selected ? 'text-route' : 'text-text-secondary')}>
                      {f.id}
                    </span>
                    <span
                      className="shrink-0 rounded px-1.5 py-px text-[9.5px] font-semibold"
                      style={{ color: c.color, background: `${c.color}22`, border: `1px solid ${c.color}40` }}
                    >
                      {c.label}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-text-secondary">{f.driver}</div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-text-muted">
                    <span>ETA {f.eta}</span>
                    {f.speed > 0 && <span>{f.speed} km/h</span>}
                  </div>
                </div>
                {f.selected && <div className="h-8 w-[2.5px] shrink-0 rounded-full bg-route" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert panel (top-right) */}
      <div className="absolute right-4 top-4 z-[15] flex w-[308px] flex-col gap-2">
        <Alert tone="error" title="Fleet FLT-007 off route" time="3m ago" className="glass-panel shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          FLT-007 (Nurul Hidayat) deviated 2.3 km from route MNF-240015. Check position immediately.
        </Alert>
        <Alert tone="warning" title="FLT-002 delayed +45 min" time="12m ago" className="glass-panel shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          Ahmad Fauzi held up on Jl. Bypass Ngurah Rai. ETA updated to 16:45 WIB.
        </Alert>
      </div>

      {/* Zoom controls (bottom-left) */}
      <div className="absolute bottom-5 left-4 z-[15] flex flex-col gap-1">
        <div className="glass-panel flex flex-col overflow-hidden rounded-lg border border-border">
          <button className="flex h-[34px] w-[34px] items-center justify-center text-text-secondary hover:bg-surface-2">
            <Plus className="h-4 w-4" />
          </button>
          <button className="flex h-[34px] w-[34px] items-center justify-center border-t border-border text-text-secondary hover:bg-surface-2">
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <button className="glass-panel flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-2">
          <LocateFixed className="h-4 w-4" />
        </button>
        <button className="glass-panel flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-surface-2">
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Legend (bottom-right) */}
      <div className="glass-panel absolute bottom-[72px] right-4 z-[15] rounded-xl border border-border p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[1.2px] text-text-muted">Fleet Status</div>
        <div className="flex flex-col gap-1.5">
          {LEGEND.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[11px] text-text-secondary">{l.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-2">
          <span className="h-[2.5px] w-5 rounded-full bg-route" />
          <span className="text-[11px] text-route">Active AI Route</span>
        </div>
      </div>

      {/* Scale bar */}
      <div className="glass-panel absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded px-2.5 py-1">
        <span className="h-0.5 w-14 bg-text-muted" />
        <span className="font-mono text-[9.5px] text-text-muted">≈ 10 km</span>
      </div>
    </div>
  );
}

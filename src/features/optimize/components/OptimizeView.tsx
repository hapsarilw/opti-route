import { Loader2, Lock, Sparkles, X, ClipboardCheck, RotateCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { PriorityChip } from '@/components/shared/PriorityChip';
import { Skeleton } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { Priority } from '@/types';

const SELECTED: { id: string; recipient: string; region: string; priority: Priority }[] = [
  { id: 'MNF-240001', recipient: 'Bali Fresh Organics Tbk', region: 'Denpasar Utara', priority: 'HIGH' },
  { id: 'MNF-240007', recipient: 'PT Tirtha Bridal Jimbaran', region: 'Jimbaran', priority: 'HIGH' },
  { id: 'MNF-240014', recipient: 'PT Bali Hai Diving Adventures', region: 'Benoa', priority: 'NORMAL' },
];

const ETA_METRICS = [
  { label: 'ETA Total', value: '78 min' },
  { label: 'Distance', value: '45 km' },
  { label: 'Stops', value: '3' },
];

const TIMELINE = [
  { seq: 1, id: 'MNF-240001', recipient: 'Bali Fresh Organics', region: 'Denpasar Utara', priority: 'HIGH' as const, eta: 'Start', note: 'Start point · nearest warehouse' },
  { seq: 2, id: 'MNF-240007', recipient: 'PT Tirtha Bridal', region: 'Jimbaran', priority: 'HIGH' as const, eta: '+28 min', note: 'Southern Bali corridor' },
  { seq: 3, id: 'MNF-240014', recipient: 'PT Bali Hai Diving', region: 'Benoa', priority: 'NORMAL' as const, eta: '+50 min', note: 'End point · near Benoa Hub' },
];

function DrawerShell({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[1.5px] text-accent">{label}</span>
        <div className="h-px w-3.5 bg-border" />
      </div>
      <div className={`overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-[-4px_0_24px_rgba(0,0,0,0.35)] ${className ?? ''}`}>
        {children}
      </div>
    </div>
  );
}

function FleetRow({ locked = false }: { locked?: boolean }) {
  return (
    <div className="border-b border-border p-3.5">
      <div className="mb-2 font-mono text-[9.5px] font-bold uppercase tracking-wide text-text-muted">Select Fleet</div>
      <div className="flex items-center justify-between rounded-[9px] border border-border bg-surface-0 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-display text-[10px] font-bold text-white">
            BS
          </span>
          <div>
            <div className="text-xs font-semibold text-text-secondary">Budi Santoso</div>
            <div className="font-mono text-[10.5px] text-text-muted">Box Truck · B 1234 ABC</div>
          </div>
        </div>
        {locked ? <Lock className="h-3.5 w-3.5 text-text-muted" /> : <span className="text-text-muted">▾</span>}
      </div>
    </div>
  );
}

function SelectedList() {
  return (
    <div className="border-b border-border p-3.5">
      <div className="mb-2 font-mono text-[9.5px] font-bold uppercase tracking-wide text-text-muted">Selected Manifests</div>
      <div className="flex flex-col gap-1.5">
        {SELECTED.map((m) => (
          <div key={m.id} className="rounded-[9px] border border-border bg-surface-0 px-3 py-2.5">
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[11.5px] font-bold text-text-secondary">{m.id}</div>
                <div className="truncate text-[11px] text-text-secondary">{m.recipient}</div>
                <div className="text-[10px] text-text-muted">{m.region}</div>
              </div>
              <PriorityChip priority={m.priority} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawerHead({
  iconBg,
  icon,
  subtitle,
  subtitleClass,
  badge,
}: {
  iconBg: string;
  icon: React.ReactNode;
  subtitle: string;
  subtitleClass?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border p-3.5">
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>{icon}</span>
          <div>
            <div className="font-display text-[13px] font-bold leading-tight text-text-primary">AI Route Optimization</div>
            <div className={`mt-px font-mono text-[10px] ${subtitleClass ?? 'text-text-muted'}`}>{subtitle}</div>
          </div>
        </div>
        {badge ?? (
          <button className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-2">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function OptimizeView() {
  return (
    <div className="flex flex-col gap-4 p-5 animate-fade-up">
      <PageHeader title="Route Optimizer" meta="AI-powered · 3 manifests selected · 4 states" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* (A) IDLE */}
        <DrawerShell label="A · Idle">
          <DrawerHead
            iconBg="bg-accent/20"
            icon={<Sparkles className="h-3.5 w-3.5 text-accent-bright" />}
            subtitle="Copilot · OptiRoute AI"
          />
          <div className="border-b border-border px-3.5 py-3">
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-accent/30 bg-accent/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent-bright">
                3 stops selected
              </span>
              <span className="font-mono text-[11px] text-text-muted">· 9,640 kg</span>
            </div>
          </div>
          <FleetRow />
          <SelectedList />
          <div className="p-3.5">
            <Button variant="primary" size="lg" className="w-full">
              <Sparkles className="h-3.5 w-3.5" /> Optimize Route
            </Button>
            <div className="mt-2 text-center font-mono text-[10px] text-text-muted">Model: OptiRoute-v2 · ~3–6 sec</div>
          </div>
        </DrawerShell>

        {/* (B) LOADING */}
        <DrawerShell label="B · Loading">
          <DrawerHead
            iconBg="bg-warning/15"
            icon={<Loader2 className="h-3.5 w-3.5 animate-spin text-[#FBBF24]" />}
            subtitle="Optimizing route…"
            subtitleClass="text-[#B5791F]"
            badge={
              <span className="rounded-md border border-[#FBBF24]/30 bg-[#FBBF24]/15 px-2 py-0.5 text-[10px] font-bold text-[#FBBF24]">
                OPTIMIZING
              </span>
            }
          />
          <FleetRow locked />
          <div className="border-b border-border p-3.5">
            <div className="mb-2 font-mono text-[9.5px] font-bold uppercase tracking-wide text-text-muted">Selected Manifests</div>
            <div className="flex flex-col gap-1.5">
              {SELECTED.map((m) => (
                <div key={m.id} className="flex flex-col gap-1.5 rounded-[9px] border border-border bg-surface-0 p-2.5">
                  <Skeleton className="h-2.5 w-3/5 animate-shimmer" />
                  <Skeleton className="h-2 w-4/5 animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-3.5">
            <Button variant="secondary" size="lg" className="w-full" loading disabled>
              Optimizing…
            </Button>
            <div className="mt-2 text-center font-mono text-[10px] text-text-muted">Please wait · don&apos;t close</div>
          </div>
        </DrawerShell>

        {/* (C) RESULT */}
        <DrawerShell label="C · Result" className="border-accent/35 border-l-[3px] border-l-accent">
          <DrawerHead
            iconBg="bg-accent/20"
            icon={<Sparkles className="h-3.5 w-3.5 text-accent-bright" />}
            subtitle="Route ready · 3 stops"
            subtitleClass="text-accent-bright"
            badge={
              <span className="rounded-md border border-[#C084FC]/30 bg-[#C084FC]/15 px-2 py-0.5 text-[10px] font-bold text-[#C084FC]">
                OPTIMIZED ✓
              </span>
            }
          />
          <div className="grid grid-cols-3 gap-1.5 border-b border-border p-3.5">
            {ETA_METRICS.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-surface-0 px-2 py-2 text-center">
                <div className="font-display text-[17px] font-bold leading-none text-text-primary">{m.value}</div>
                <div className="mt-1 font-mono text-[9.5px] uppercase text-text-muted">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="border-b border-border p-3.5">
            <div className="mb-2.5 font-mono text-[9.5px] font-bold uppercase tracking-wide text-text-muted">Optimal Sequence</div>
            {TIMELINE.map((t, i) => (
              <div key={t.id} className="flex gap-2.5">
                <div className="flex w-[22px] flex-col items-center">
                  <span
                    className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 font-display text-[9.5px] font-bold"
                    style={{
                      color: t.priority === 'HIGH' ? '#F87171' : '#3FBF8E',
                      borderColor: t.priority === 'HIGH' ? '#F87171' : '#3FBF8E',
                      background: t.priority === 'HIGH' ? 'rgba(248,113,113,0.12)' : 'rgba(30,138,99,0.12)',
                    }}
                  >
                    {t.seq}
                  </span>
                  {i < TIMELINE.length - 1 && <div className="min-h-3.5 w-0.5 flex-1 bg-border" />}
                </div>
                <div className="min-w-0 flex-1 pb-3">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate font-mono text-[11.5px] font-bold text-text-secondary">{t.id}</span>
                    <PriorityChip priority={t.priority} />
                  </div>
                  <div className="truncate text-[11px] text-text-secondary">{t.recipient}</div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[10px] text-text-muted">{t.region}</span>
                    <span className="font-mono text-[10.5px] font-semibold text-accent-bright">{t.eta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-b border-border p-3.5">
            <div className="rounded-[10px] border border-accent/20 bg-accent/[0.07] p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent-bright" />
                <span className="text-[10.5px] font-bold uppercase tracking-wide text-accent-bright">AI Insights</span>
              </div>
              <p className="text-[11.5px] leading-relaxed text-text-secondary">
                Sequence adjusted so <strong className="text-[#F87171]">HIGH</strong> priority stops complete first.
                Estimated savings of <strong className="text-accent-bright">18%</strong> vs. manual ordering.
              </p>
            </div>
          </div>
          <div className="p-3.5">
            <Button variant="primary" size="lg" className="w-full">
              <ClipboardCheck className="h-3.5 w-3.5" /> Assign Driver
            </Button>
          </div>
        </DrawerShell>

        {/* (D) ERROR */}
        <DrawerShell label="D · Error">
          <DrawerHead
            iconBg="bg-error/12"
            icon={<X className="h-3.5 w-3.5 text-[#F87171]" />}
            subtitle="Copilot · OptiRoute AI"
          />
          <div className="border-b border-border p-3.5">
            <Alert tone="error" title="Optimization failed">
              Server timeout after 30 seconds. Check your network connection and try again.
            </Alert>
          </div>
          <FleetRow />
          <div className="p-3.5">
            <Button variant="danger" size="lg" className="w-full">
              <RotateCw className="h-3.5 w-3.5" /> Try Again
            </Button>
            <div className="mt-2 text-center font-mono text-[10px] text-text-muted">Error 504 · timeout · AI server</div>
          </div>
        </DrawerShell>
      </div>
    </div>
  );
}

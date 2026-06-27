'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ClipboardCheck, Loader2, Lock, RotateCw, Sparkles, X } from 'lucide-react';
import type { Fleet, Manifest, OptimizeRequest } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { WAREHOUSE_ORIGIN } from '@/config/constants';
import { PriorityChip } from '@/components/shared/PriorityChip';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { formatWeight } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AssignDriverContext } from '@/features/dispatch';
import { OptimizeError } from '../api/optimize-api';
import { useIdleFleet } from '../hooks/useIdleFleet';
import { useOptimizeRoute } from '../hooks/useOptimizeRoute';
import { buildTimeline, routeDistanceKm } from '../lib/route-view';

interface OptimizeDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedManifests: Manifest[];
  /** Opens the AssignDriverModal (Process 3) with the optimized route context. */
  onAssignDriver?: (ctx: AssignDriverContext) => void;
}

const SECTION = 'border-b border-border p-3.5';
const LABEL = 'mb-2 font-mono text-[9.5px] font-bold uppercase tracking-wide text-text-muted';

function fleetInitials(f: Fleet): string {
  return f.vehicle_type.slice(0, 2).toUpperCase();
}

function fleetLabel(f: Fleet): string {
  const type = f.vehicle_type.charAt(0) + f.vehicle_type.slice(1).toLowerCase();
  return `${type} · ${f.plate_number}`;
}

/**
 * OptimizeDrawer — Process 2 (Doc 02 §2). Slides in from the right (~330px) when
 * the dispatcher optimizes a selection. The 4 visual states (idle / loading /
 * result / error) are derived directly from the optimize mutation's lifecycle.
 */
export function OptimizeDrawer({ open, onClose, selectedManifests, onAssignDriver }: OptimizeDrawerProps) {
  const user = useAuthStore((s) => s.user);
  const { data: fleets = [], isLoading: fleetsLoading } = useIdleFleet();
  const mutation = useOptimizeRoute();

  // Explicit pick (empty until the dispatcher chooses); otherwise default to the
  // first available vehicle. Derived rather than stored to avoid setState-in-effect.
  const [pickedFleetId, setPickedFleetId] = useState('');
  const fleetId = pickedFleetId || fleets[0]?.fleet_id || '';

  // Fresh idle state every time the drawer opens (clears a previous result/error).
  useEffect(() => {
    if (open) mutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopCount = selectedManifests.length;
  const totalWeight = useMemo(
    () => selectedManifests.reduce((sum, m) => sum + m.weight_kg, 0),
    [selectedManifests],
  );
  const manifestById = useMemo(
    () => new Map(selectedManifests.map((m) => [m.manifest_id, m])),
    [selectedManifests],
  );

  const selectedFleet = fleets.find((f) => f.fleet_id === fleetId);
  const overCapacity = !!selectedFleet && totalWeight > selectedFleet.capacity_kg;

  const result = mutation.data?.res;
  const timeline = useMemo(
    () => (result ? buildTimeline(result.optimized_sequence, result.waypoints, manifestById) : []),
    [result, manifestById],
  );
  const distanceKm = result ? routeDistanceKm(result.waypoints) : 0;

  const phase: 'idle' | 'loading' | 'result' | 'error' = mutation.isPending
    ? 'loading'
    : mutation.isError
      ? 'error'
      : mutation.isSuccess
        ? 'result'
        : 'idle';

  const errorCode = mutation.error instanceof OptimizeError ? mutation.error.code : undefined;

  const handleOptimize = () => {
    if (!fleetId || stopCount === 0) return;
    const payload: OptimizeRequest = {
      dispatcher_id: user.user_id,
      fleet_id: fleetId,
      origin_coordinate: WAREHOUSE_ORIGIN,
      destinations: selectedManifests.map((m) => ({
        manifest_id: m.manifest_id,
        lat: m.destination.lat,
        lng: m.destination.lng,
        priority: m.priority,
        weight_kg: m.weight_kg,
      })),
    };
    mutation.mutate(payload);
  };

  // The drawer must not close mid-optimization (Doc 02 §2.4 — "do not close").
  const handleClose = () => {
    if (mutation.isPending) return;
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="AI Route Optimization">
      {/* Backdrop — blocks grid interaction (rows can't be unchecked while open). */}
      <div
        className={cn('absolute inset-0 bg-black/50 backdrop-blur-[1px]', mutation.isPending && 'cursor-wait')}
        onClick={handleClose}
      />

      {/* Panel */}
      <aside
        className={cn(
          'relative flex h-full w-[330px] flex-col overflow-hidden border-l bg-surface-1 shadow-[-4px_0_24px_rgba(0,0,0,0.45)]',
          'animate-slide-in-right',
          phase === 'result' ? 'border-accent/35' : 'border-border',
        )}
        style={phase === 'result' ? { borderLeft: '3px solid var(--accent)' } : undefined}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={SECTION}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  phase === 'loading'
                    ? 'bg-[#FBBF24]/15'
                    : phase === 'error'
                      ? 'bg-error/12'
                      : 'bg-accent/20',
                )}
              >
                {phase === 'loading' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FBBF24]" />
                ) : phase === 'error' ? (
                  <X className="h-3.5 w-3.5 text-[#F87171]" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-accent-bright" />
                )}
              </span>
              <div>
                <div className="font-display text-[13px] font-bold leading-tight text-text-primary">
                  AI Route Optimization
                </div>
                <div
                  className={cn(
                    'mt-px font-mono text-[10px]',
                    phase === 'loading'
                      ? 'text-[#B5791F]'
                      : phase === 'result'
                        ? 'text-accent-bright'
                        : 'text-text-muted',
                  )}
                >
                  {phase === 'loading'
                    ? 'Optimizing route…'
                    : phase === 'result'
                      ? `Route ready · ${result?.optimized_sequence.length} stops`
                      : 'Copilot · OptiRoute AI'}
                </div>
              </div>
            </div>

            {phase === 'loading' ? (
              <span className="shrink-0 rounded-md border border-[#FBBF24]/30 bg-[#FBBF24]/15 px-2 py-0.5 text-[10px] font-bold text-[#FBBF24]">
                OPTIMIZING
              </span>
            ) : phase === 'result' ? (
              <span className="shrink-0 rounded-md border border-[#C084FC]/30 bg-[#C084FC]/15 px-2 py-0.5 text-[10px] font-bold text-[#C084FC]">
                OPTIMIZED ✓
              </span>
            ) : (
              <button
                onClick={handleClose}
                aria-label="Close drawer"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sub-header: stop/weight summary (idle, loading) */}
          {(phase === 'idle' || phase === 'loading') && (
            <div className="mt-2.5 flex items-center gap-1.5">
              {phase === 'loading' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FBBF24]/25 bg-[#FBBF24]/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#FBBF24]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FBBF24]" />
                  {stopCount} stops · calculating…
                </span>
              ) : (
                <>
                  <span className="rounded-full border border-accent/30 bg-accent/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent-bright">
                    {stopCount} {stopCount === 1 ? 'stop' : 'stops'} selected
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">· {formatWeight(totalWeight)} total</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Body (scrollable) ──────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {phase === 'error' && (
            <div className={SECTION}>
              <Alert tone="error" title="Optimization failed">
                {mutation.error?.message ?? 'The AI server did not return a route.'}
              </Alert>
            </div>
          )}

          {phase === 'result' ? (
            <ResultBody
              etaMins={result?.estimated_total_duration_mins ?? 0}
              distanceKm={distanceKm}
              stops={result?.optimized_sequence.length ?? 0}
              timeline={timeline}
              insights={result?.ai_insights ?? ''}
            />
          ) : (
            <>
              {/* Fleet selector (idle / loading skeleton / error) */}
              <div className={cn(SECTION, phase === 'loading' && 'pointer-events-none opacity-45')}>
                <div className={LABEL}>Select Fleet</div>
                {phase === 'loading' ? (
                  <div className="flex items-center justify-between rounded-[9px] border border-border bg-surface-0 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 animate-shimmer rounded-full" />
                      <div className="flex flex-col gap-1.5">
                        <span className="h-2.5 w-20 animate-shimmer rounded" />
                        <span className="h-2 w-28 animate-shimmer rounded" />
                      </div>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-text-muted" />
                  </div>
                ) : (
                  <FleetSelector
                    fleets={fleets}
                    loading={fleetsLoading}
                    value={fleetId}
                    onChange={setPickedFleetId}
                    selected={selectedFleet}
                  />
                )}
                {overCapacity && phase !== 'loading' && (
                  <p className="mt-2 font-mono text-[10px] text-[#F87171]">
                    ⚠ Load {formatWeight(totalWeight)} exceeds capacity {formatWeight(selectedFleet!.capacity_kg)}.
                  </p>
                )}
              </div>

              {/* Selected manifests (skeleton while loading) */}
              <div className={SECTION}>
                <div className={LABEL}>Selected Manifests</div>
                <div className="flex flex-col gap-1.5">
                  {phase === 'loading'
                    ? selectedManifests.map((m) => (
                        <div
                          key={m.manifest_id}
                          className="flex flex-col gap-1.5 rounded-[9px] border border-border bg-surface-0 p-2.5"
                        >
                          <span className="h-2.5 w-16 animate-shimmer rounded" />
                          <span className="h-2 w-32 animate-shimmer rounded" />
                          <span className="h-2 w-14 animate-shimmer rounded" />
                        </div>
                      ))
                    : selectedManifests.map((m) => (
                        <ManifestCard key={m.manifest_id} manifest={m} dim={phase === 'error'} />
                      ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer CTA ─────────────────────────────────────────── */}
        <div className="border-t border-border p-3.5">
          {phase === 'result' ? (
            <>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  if (result && selectedFleet) {
                    onAssignDriver?.({
                      routeId: result.route_id,
                      fleetId,
                      stopCount: result.optimized_sequence.length,
                      etaMins: result.estimated_total_duration_mins,
                      vehicleLabel: fleetLabel(selectedFleet),
                    });
                  }
                }}
              >
                <ClipboardCheck className="h-3.5 w-3.5" /> Assign Driver
              </Button>
              <div className="mt-2 text-center font-mono text-[10px] text-text-muted">
                {selectedFleet ? `${fleetLabel(selectedFleet)} · ready` : 'Ready to assign'}
              </div>
            </>
          ) : phase === 'error' ? (
            <>
              <Button variant="danger" size="lg" className="w-full" onClick={handleOptimize}>
                <RotateCw className="h-3.5 w-3.5" /> Try Again
              </Button>
              <div className="mt-2 text-center font-mono text-[10px] text-text-muted">
                Error {errorCode ?? 504} · timeout · AI server
              </div>
            </>
          ) : phase === 'loading' ? (
            <>
              <Button variant="secondary" size="lg" className="w-full" loading disabled>
                Optimizing…
              </Button>
              <div className="mt-2 text-center font-mono text-[10px] text-text-muted">
                Please wait · do not close the drawer
              </div>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleOptimize}
                disabled={!fleetId || stopCount === 0}
              >
                <Sparkles className="h-3.5 w-3.5" /> Optimize Route
              </Button>
              <div className="mt-2 text-center font-mono text-[10px] text-text-muted">
                Model: OptiRoute-v2 · ~3–6 seconds
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

// ── Fleet selector (native <select> styled to match the prototype) ──────────
function FleetSelector({
  fleets,
  loading,
  value,
  onChange,
  selected,
}: {
  fleets: Fleet[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
  selected?: Fleet;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[9px] border border-border bg-surface-0 px-3 py-2.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
        <span className="text-[11.5px] text-text-muted">Loading fleet…</span>
      </div>
    );
  }
  if (fleets.length === 0) {
    return (
      <div className="rounded-[9px] border border-border bg-surface-0 px-3 py-2.5 text-[11.5px] text-text-muted">
        No idle fleet available.
      </div>
    );
  }
  return (
    <div className="relative flex items-center justify-between rounded-[9px] border border-border bg-surface-0 px-3 py-2.5 hover:bg-surface-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-[10px] font-bold text-white">
          {selected ? fleetInitials(selected) : '—'}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-text-secondary">
            {selected ? fleetLabel(selected) : 'Select a vehicle'}
          </div>
          <div className="font-mono text-[10.5px] text-text-muted">
            {selected ? `Capacity ${formatWeight(selected.capacity_kg)}` : ''}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <select
        aria-label="Select fleet"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {fleets.map((f) => (
          <option key={f.fleet_id} value={f.fleet_id}>
            {fleetLabel(f)} — {formatWeight(f.capacity_kg)}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Selected manifest card (idle/error list) ────────────────────────────────
function ManifestCard({ manifest, dim }: { manifest: Manifest; dim?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[9px] border bg-surface-0 px-3 py-2.5',
        manifest.priority === 'HIGH' ? 'border-[#F87171]/20' : 'border-border',
        dim && 'opacity-75',
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate font-mono text-[11.5px] font-bold',
              manifest.priority === 'HIGH' ? 'text-[#E8D4B0]' : 'text-text-secondary',
            )}
          >
            {manifest.manifest_id}
          </div>
          <div className="truncate text-[11px] text-text-secondary">{manifest.recipient_name}</div>
          <div className="text-[10px] text-text-muted">{manifest.region}</div>
        </div>
        <PriorityChip priority={manifest.priority} />
      </div>
    </div>
  );
}

// ── Result body: metrics + timeline + AI insights ───────────────────────────
function ResultBody({
  etaMins,
  distanceKm,
  stops,
  timeline,
  insights,
}: {
  etaMins: number;
  distanceKm: number;
  stops: number;
  timeline: ReturnType<typeof buildTimeline>;
  insights: string;
}) {
  const metrics = [
    { label: 'ETA Total', value: `${etaMins} min` },
    { label: 'Distance', value: `${distanceKm.toFixed(distanceKm < 100 ? 1 : 0)} km` },
    { label: 'Stops', value: String(stops) },
  ];
  return (
    <>
      {/* Summary metrics */}
      <div className={cn(SECTION, 'grid grid-cols-3 gap-1.5')}>
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-surface-0 px-2 py-2 text-center">
            <div className="font-display text-[17px] font-bold leading-none text-text-primary">{m.value}</div>
            <div className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-text-muted">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Optimal sequence timeline */}
      <div className={SECTION}>
        <div className="mb-2.5 font-mono text-[9.5px] font-bold uppercase tracking-wide text-text-muted">
          Optimal Sequence
        </div>
        {timeline.map((t) => {
          const high = t.priority === 'HIGH';
          return (
            <div key={t.manifestId} className="flex gap-2.5">
              <div className="flex w-[22px] flex-col items-center">
                <span
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 font-display text-[9.5px] font-bold"
                  style={{
                    color: high ? '#F87171' : '#3FBF8E',
                    borderColor: high ? '#F87171' : '#3FBF8E',
                    background: high ? 'rgba(248,113,113,0.12)' : 'rgba(30,138,99,0.12)',
                  }}
                >
                  {t.seq}
                </span>
                {!t.isLast && <div className="min-h-3.5 w-0.5 flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate font-mono text-[11.5px] font-bold text-text-secondary">
                    {t.manifestId}
                  </span>
                  <PriorityChip priority={t.priority} />
                </div>
                <div className="truncate text-[11px] text-text-secondary">{t.recipient}</div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] text-text-muted">{t.region}</span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-[10.5px] font-semibold',
                      t.isFirst ? 'text-accent-bright' : 'text-text-secondary',
                    )}
                  >
                    {t.eta}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] italic text-text-muted">{t.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI insights */}
      <div className={SECTION}>
        <div className="rounded-[10px] border border-accent/20 bg-accent/[0.07] p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent-bright" />
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-accent-bright">AI Insights</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-text-secondary">{insights}</p>
        </div>
      </div>
    </>
  );
}

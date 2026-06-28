'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Clock, MapPin, RotateCw, Truck, X } from 'lucide-react';
import type { Driver, VehicleType } from '@/types';
import { WAREHOUSE_ORIGIN } from '@/config/constants';
import { haversineKm } from '@/lib/haversine';
import { formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from '@/stores/toast-store';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/rbac/Can';
import { useAvailableDrivers } from '../hooks/useAvailableDrivers';
import { useDispatch } from '../hooks/useDispatch';

/** Context passed from OptimizeDrawer when a route is OPTIMIZED and ready to assign. */
export interface AssignDriverContext {
  routeId: string;
  fleetId: string;
  fleetVehicleType: VehicleType; // gates which drivers (by license class) may be assigned
  stopCount: number;
  etaMins: number;
  vehicleLabel: string; // e.g. "Truck · DK 1234 AB"
}

interface AssignDriverModalProps {
  open: boolean;
  onClose: () => void;
  ctx: AssignDriverContext;
}

function driverInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** "TRUCK" → "Truck" for the per-row license badge. */
function titleCaseVehicle(t: VehicleType): string {
  return t.charAt(0) + t.slice(1).toLowerCase();
}

/** Candidate driver enriched with Haversine distance from warehouse origin. */
interface RankedDriver extends Driver {
  distKm: number;
}

/** Available drivers licensed for `vehicleType`, nearest-first. */
function rankDrivers(drivers: Driver[], vehicleType: VehicleType): RankedDriver[] {
  return drivers
    .filter((d) => d.status === 'AVAILABLE' && d.location && d.vehicle_type === vehicleType)
    .map((d) => ({ ...d, distKm: haversineKm(d.location!, WAREHOUSE_ORIGIN) }))
    .sort((a, b) => a.distKm - b.distKm);
}

export function AssignDriverModal({ open, onClose, ctx }: AssignDriverModalProps) {
  const {
    data: rawDrivers = [],
    isLoading: driversLoading,
    isError: driversError,
    isFetching: driversFetching,
    refetch: refetchDrivers,
  } = useAvailableDrivers();
  const mutation = useDispatch();

  // Manual selection; empty string = "use nearest" (derived below)
  const [selectedId, setSelectedId] = useState<string>('');
  const [phase, setPhase] = useState<'select' | 'success'>('select');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const candidates = useMemo(
    () => rankDrivers(rawDrivers, ctx.fleetVehicleType),
    [rawDrivers, ctx.fleetVehicleType],
  );

  // Cleanup the auto-close timer when the component unmounts or closes.
  // The parent mounts/unmounts this component via `{assignCtx && <AssignDriverModal>}`,
  // so state is reset naturally on each open without a reset effect.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Derive effective selection: manual pick > nearest candidate
  const effectiveId = selectedId || candidates[0]?.driver_id || '';
  const selectedDriver = candidates.find((d) => d.driver_id === effectiveId);
  const vehicleType = ctx.vehicleLabel.split(' · ')[0]; // "Truck"

  const handleDispatch = () => {
    if (!effectiveId || mutation.isPending) return;
    mutation.mutate(
      { route_id: ctx.routeId, fleet_id: ctx.fleetId, driver_id: effectiveId },
      {
        onSuccess: () => {
          setPhase('success');
          toast.success(
            'Route dispatched',
            `${selectedDriver?.name ?? 'Driver'} · ${ctx.stopCount} stops · ${formatDuration(ctx.etaMins)} ETA`,
          );
          // Auto-close after the success animation completes (~2 s)
          closeTimerRef.current = setTimeout(() => {
            onClose();
          }, 2100);
        },
      },
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Assign Driver">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-fade-in"
        onClick={phase === 'select' && !mutation.isPending ? onClose : undefined}
      />

      {/* Modal card */}
      <div className="relative z-10 flex w-[452px] max-w-full max-h-[calc(100vh-48px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.07] bg-surface-1 shadow-[0_24px_70px_rgba(0,0,0,0.6)] animate-fade-up">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="border-b border-border bg-gradient-to-b from-[#A855F7]/[0.06] to-transparent p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#C084FC]/30 bg-[#C084FC]/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-[#C084FC]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#C084FC]" />
              ROUTE OPTIMIZED
            </span>
            <button
              onClick={phase === 'select' && !mutation.isPending ? onClose : undefined}
              disabled={mutation.isPending || phase === 'success'}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-2 disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="font-display text-[21px] font-bold tracking-[-0.4px] text-text-primary">Assign Driver</h2>
          <p className="mt-1 text-xs text-text-secondary">
            Select a driver for route{' '}
            <span className="font-mono font-semibold text-text-primary">{ctx.routeId}</span>
          </p>

          {/* Summary stat tiles */}
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <StatTile icon={<Truck className="h-3 w-3 text-text-secondary" />} label="Fleet" value={vehicleType} />
            <StatTile icon={<MapPin className="h-3 w-3 text-text-secondary" />} label="Stops" value={`${ctx.stopCount} stops`} />
            <StatTile
              icon={<Clock className="h-3 w-3 text-accent-bright" />}
              label="ETA"
              value={formatDuration(ctx.etaMins)}
              valueClass="text-accent-bright"
            />
          </div>
        </div>

        {/* ── Driver list ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pb-1 pt-3.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-text-muted">
            {vehicleType} drivers · nearest ↓
          </span>
          <span className="font-mono text-[10.5px] text-text-muted">
            {driversLoading || driversError ? '—' : candidates.length} available
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3.5 pb-2.5 pt-1.5">
          {driversLoading ? (
            Array.from({ length: 4 }, (_, i) => <DriverRowSkeleton key={i} />)
          ) : driversError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#F87171]/25 bg-error/[0.07] p-5 text-center">
              <AlertTriangle className="h-5 w-5 text-[#F87171]" />
              <div className="space-y-1">
                <div className="text-[12.5px] font-semibold text-text-primary">Couldn’t load drivers</div>
                <div className="font-mono text-[10.5px] text-text-muted">
                  The driver roster request failed. Check your connection and retry.
                </div>
              </div>
              <Button variant="secondary" onClick={() => refetchDrivers()} loading={driversFetching}>
                <RotateCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : candidates.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-0 p-4 text-center font-mono text-[11px] text-text-muted">
              No available {vehicleType}-licensed drivers found.
            </div>
          ) : (
            candidates.map((d, i) => (
              <DriverRow
                key={d.driver_id}
                driver={d}
                isNearest={i === 0}
                selected={d.driver_id === effectiveId}
                disabled={mutation.isPending}
                onSelect={() => !mutation.isPending && setSelectedId(d.driver_id)}
              />
            ))
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 border-t border-border bg-surface-0 px-5 py-3.5">
          <div className="min-w-0 flex-1 text-[11px] text-text-muted">
            Dispatch to{' '}
            <span className="font-semibold text-text-secondary">
              {selectedDriver?.name ?? '—'}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending || phase === 'success'}
          >
            Cancel
          </Button>
          <Can
            permission="route:dispatch"
            fallback={
              <span className="inline-flex items-center gap-1.5 rounded-input border border-[#F87171]/30 bg-error/12 px-3 py-1.5 font-mono text-[11px] font-semibold text-[#F87171]">
                No dispatch permission
              </span>
            }
          >
            <Button
              variant="primary"
              onClick={handleDispatch}
              disabled={!effectiveId || driversLoading || driversError}
              loading={mutation.isPending}
            >
              Dispatch
            </Button>
          </Can>
        </div>

        {/* ── Success overlay ───────────────────────────────────── */}
        {phase === 'success' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[18px] bg-surface-0/97 backdrop-blur-[2px] animate-fade-in">
            <SuccessRing />
            <div className="animate-fade-up text-center">
              <div className="font-display text-[20px] font-bold tracking-[-0.3px] text-text-primary">
                Dispatched <span className="text-accent-bright">✓</span>
              </div>
              <div className="mt-1.5 text-[12.5px] text-text-secondary">
                {selectedDriver?.name} · route{' '}
                <span className="font-mono text-text-primary">{ctx.routeId}</span>
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-text-muted">
                ETA {formatDuration(ctx.etaMins)} · {ctx.stopCount} stops · {vehicleType}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-0 px-2.5 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <span className="font-mono text-[8.5px] font-bold uppercase tracking-wide text-text-muted">{label}</span>
      </div>
      <div className={cn('font-display text-[13.5px] font-bold text-text-primary', valueClass)}>
        {value}
      </div>
    </div>
  );
}

function DriverRow({
  driver,
  isNearest,
  selected,
  disabled,
  onSelect,
}: {
  driver: RankedDriver;
  isNearest: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
        selected ? 'border-accent/45 bg-accent/10' : 'border-border-subtle hover:bg-surface-2/60',
        disabled && 'cursor-default',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border font-display text-[12.5px] font-bold',
          selected
            ? 'border-accent/40 bg-accent/20 text-accent-bright'
            : 'border-border bg-surface-2 text-text-secondary',
        )}
      >
        {driverInitials(driver.name)}
        <span className="absolute -bottom-0.5 -right-0.5 h-[11px] w-[11px] rounded-full border-2 border-surface-1 bg-accent-bright" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-text-primary truncate">{driver.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-text-secondary">
            <Truck className="h-2.5 w-2.5" />
            {titleCaseVehicle(driver.vehicle_type)}
          </span>
          {isNearest && (
            <span className="shrink-0 rounded bg-accent-bright px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-surface-0">
              Nearest
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2.5">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-bright" />
            <span className="font-mono text-[10px] font-semibold text-accent-bright tracking-[0.3px]">AVAILABLE</span>
          </span>
          <span className="text-[11.5px] text-text-secondary">{driver.distKm.toFixed(1)} km from warehouse</span>
        </div>
      </div>

      {/* Radio */}
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-accent' : 'border-surface-3',
        )}
      >
        {selected && <span className="h-[9px] w-[9px] rounded-full bg-accent" />}
      </span>
    </button>
  );
}

function DriverRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
      <span className="h-[38px] w-[38px] shrink-0 animate-shimmer rounded-[10px]" />
      <div className="flex-1 space-y-1.5">
        <span className="block h-3 w-28 animate-shimmer rounded" />
        <span className="block h-2.5 w-36 animate-shimmer rounded" />
      </div>
      <span className="h-5 w-5 animate-shimmer rounded-full" />
    </div>
  );
}

function SuccessRing() {
  return (
    <div className="relative flex h-[88px] w-[88px] items-center justify-center">
      <span className="absolute inset-0 animate-[ping_0.9s_ease-out_0.1s_1] rounded-full border-2 border-[#2DD4BF] opacity-0" />
      <span className="absolute inset-0 animate-[ping_0.9s_ease-out_0.28s_1] rounded-full border-2 border-accent-bright opacity-0" />
      <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-gradient-to-br from-[#27A074] to-[#1B7A55] shadow-[0_8px_28px_rgba(30,138,99,0.45)]">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

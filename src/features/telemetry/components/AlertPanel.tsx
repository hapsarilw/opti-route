'use client';

import { X } from 'lucide-react';
import type { MonitoredFleet } from '@/types';
import { Alert } from '@/components/ui/Alert';

export interface FleetAlert {
  fleet_id: string;
  driver_name: string;
  manifest_id: string;
}

/** Off-route vehicles → red alerts (Doc 02 §4.3, triggered by `is_off_route`). */
export function deriveAlerts(fleets: MonitoredFleet[]): FleetAlert[] {
  return fleets
    .filter((f) => f.is_off_route)
    .map((f) => ({ fleet_id: f.fleet_id, driver_name: f.driver_name, manifest_id: f.manifest_id }));
}

interface AlertPanelProps {
  alerts: FleetAlert[];
  time: string; // shared "Xs ago"-style stamp (live clock)
  onDismiss: (fleetId: string) => void;
}

/**
 * Top-right alert stack (Doc 02 §4). One dismissible red card per off-route
 * vehicle; dismissed ids are tracked by the parent so a recovered-then-deviated
 * vehicle can re-alert.
 */
export function AlertPanel({ alerts, time, onDismiss }: AlertPanelProps) {
  if (alerts.length === 0) return null;
  return (
    <div className="absolute right-4 top-16 z-[15] flex w-[308px] flex-col gap-2">
      {alerts.map((a) => (
        <div key={a.fleet_id} className="relative">
          <Alert
            tone="error"
            title={`Vehicle ${a.fleet_id} off route`}
            className="glass-panel pr-7 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
          >
            {a.driver_name} deviated from route {a.manifest_id}. Check position immediately.
            <div className="mt-1 font-mono text-[9.5px] text-text-muted/80">{time} WIB</div>
          </Alert>
          <button
            onClick={() => onDismiss(a.fleet_id)}
            aria-label={`Dismiss alert for ${a.fleet_id}`}
            className="absolute right-2 top-2.5 flex h-5 w-5 items-center justify-center rounded text-text-muted hover:bg-surface-2 hover:text-text-secondary"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

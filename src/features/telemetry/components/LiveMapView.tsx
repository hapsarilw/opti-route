'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { useLiveFleet } from '../hooks/useLiveFleet';
import { AlertPanel, deriveAlerts } from './AlertPanel';
import { FleetPanel } from './FleetPanel';
import { LiveStatusPill } from './LiveStatusPill';

// Mapbox GL touches `window` at import → load the map only on the client.
// Unmounting this (navigating away from /map) disposes the GL context.
const FleetMap = dynamic(() => import('./FleetMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-0">
      <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
    </div>
  ),
});

/**
 * LiveMapView — Process 4 orchestrator (Doc 02 §4). Owns selection + alert
 * dismissal; streams the merged live fleet into the WebGL map and the overlay
 * panels. The map (and its telemetry poll) tear down on unmount — no leaks.
 */
export function LiveMapView() {
  const { fleets, route, onRouteCount, exceptionCount, isLoading } = useLiveFleet();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Off-route vehicles that the dispatcher hasn't dismissed this session.
  const alerts = useMemo(
    () => deriveAlerts(fleets).filter((a) => !dismissed.has(a.fleet_id)),
    [fleets, dismissed],
  );

  const stamp = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="relative h-[calc(100vh-52px)] overflow-hidden animate-fade-up">
      <FleetMap fleets={fleets} route={route} selectedId={selectedId} onSelectFleet={setSelectedId} />

      <LiveStatusPill onRouteCount={onRouteCount} />

      <FleetPanel
        fleets={fleets}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRouteCount={onRouteCount}
        exceptionCount={exceptionCount}
      />

      <AlertPanel
        alerts={alerts}
        time={stamp}
        onDismiss={(id) => setDismissed((prev) => new Set(prev).add(id))}
      />

      {isLoading && fleets.length === 0 && (
        <div className="glass-panel absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border px-3 py-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />
          <span className="font-mono text-[11px] text-text-muted">Connecting to telemetry…</span>
        </div>
      )}
    </div>
  );
}

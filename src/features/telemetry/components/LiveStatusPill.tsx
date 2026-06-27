'use client';

import { useEffect, useState } from 'react';

function clockString(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Top "● LIVE N on-route · HH:MM:SS" heartbeat + avatar (Doc 02 §4 top bar).
 * The 1-second clock interval is explicitly cleared on unmount — a second
 * deliberate example of interval cleanup alongside the telemetry poll.
 */
export function LiveStatusPill({ onRouteCount }: { onRouteCount: number }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id); // ← prevents a ticking timer from leaking
  }, []);

  return (
    <div className="absolute right-4 top-4 z-20 flex items-center gap-2.5">
      <div className="glass-panel flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5">
        <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-accent-bright" />
        <span className="font-mono text-[11px] font-bold tracking-wide text-accent-bright">LIVE</span>
        <span className="font-mono text-[10px] text-text-muted">{onRouteCount} on-route</span>
      </div>
      <div className="glass-panel rounded-lg border border-border px-2.5 py-1.5 font-mono text-[10.5px] text-text-secondary tabular-nums">
        {clockString(now)} WIB
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-accent to-[#3B5A8C] font-display text-[11px] font-bold text-white">
        RA
      </div>
    </div>
  );
}

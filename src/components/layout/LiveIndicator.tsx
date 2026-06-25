/** "● LIVE N vehicles" pill in the top bar (Process 4 heartbeat). */
export function LiveIndicator({ count }: { count: number }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1">
      <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-accent-bright" />
      <span className="font-mono text-[11px] font-semibold tracking-wide text-accent-bright">LIVE</span>
      <span className="font-mono text-[10px] text-text-muted">{count} vehicles</span>
    </div>
  );
}

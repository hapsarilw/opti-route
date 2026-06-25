import type { ReactNode } from 'react';

/** Numbered section header used by the design-system style guide. */
export function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-accent">{index}</span>
        <div className="h-px w-6 bg-border" />
        <h2 className="font-display text-[19px] font-bold tracking-[-0.3px] text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** Small uppercase label used inside cards. */
export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3.5 font-mono text-[9.5px] font-bold uppercase tracking-[1.5px] text-text-muted">
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

/** Standard page title block: display-font heading, mono meta line, optional actions. */
export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.5px] text-text-primary">
          {title}
        </h1>
        {meta && <p className="mt-1 font-mono text-xs text-text-muted">{meta}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

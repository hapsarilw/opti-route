import type { LucideIcon } from 'lucide-react';

/** Centered placeholder used by skeleton feature pages and empty data sets. */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-1 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2">
        <Icon className="h-6 w-6 text-text-muted" />
      </div>
      <div className="text-sm font-semibold text-text-secondary">{title}</div>
      <p className="max-w-sm text-xs text-text-muted">{description}</p>
    </div>
  );
}

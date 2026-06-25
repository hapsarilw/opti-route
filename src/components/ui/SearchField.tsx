import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Icon-prefixed search field (read-only presentational shell for the wireframes). */
export function SearchField({
  placeholder = 'Search…',
  value,
  className,
}: {
  placeholder?: string;
  value?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-[34px] items-center gap-2 rounded-lg border border-border bg-surface-0 px-3',
        className,
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      {value ? (
        <span className="truncate text-xs text-text-primary">{value}</span>
      ) : (
        <span className="truncate text-xs text-text-muted">{placeholder}</span>
      )}
    </div>
  );
}

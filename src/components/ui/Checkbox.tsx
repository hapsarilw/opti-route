import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Row-selection checkbox: unchecked / checked / indeterminate (prototype spec). */
export function Checkbox({
  checked = false,
  indeterminate = false,
  className,
}: {
  checked?: boolean;
  indeterminate?: boolean;
  className?: string;
}) {
  const active = checked || indeterminate;
  return (
    <span
      className={cn(
        'flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors',
        active ? 'border-accent bg-accent' : 'border-surface-3 bg-surface-0',
        className,
      )}
    >
      {checked && !indeterminate && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      {indeterminate && <span className="h-0.5 w-[7px] rounded-full bg-white" />}
    </span>
  );
}

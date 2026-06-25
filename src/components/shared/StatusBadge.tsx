import type { ManifestStatus } from '@/types';
import { STATUS_CONFIG } from '@/config/status';
import { cn } from '@/lib/utils';

/**
 * Status tag for the 9 manifest statuses — styled as a control-room "signal
 * tag": a glowing square LED + a tracked-out monospace readout. Colors come
 * from STATUS_CONFIG (design-token source of truth) and are applied inline
 * because the values are data-driven (safer than dynamic Tailwind classes).
 */
export function StatusBadge({ status, className }: { status: ManifestStatus; className?: string }) {
  const s = STATUS_CONFIG[status];
  return (
    <span
      title={s.label}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] border py-[3px] pl-1.5 pr-2',
        'font-mono text-[10px] font-medium uppercase leading-none tracking-[0.09em]',
        s.flash && 'animate-flash', // EXCEPTION: whole tag flashes
        className,
      )}
      style={{ color: s.text, backgroundColor: s.bg, borderColor: s.border }}
    >
      <span
        aria-hidden
        className={cn('h-[6px] w-[6px] shrink-0 rounded-[1.5px]', s.pulse && 'animate-pulse')}
        style={{ backgroundColor: s.text, boxShadow: `0 0 5px ${s.text}80` }}
      />
      {s.label}
    </span>
  );
}

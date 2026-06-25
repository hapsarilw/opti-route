import type { Priority } from '@/types';
import { PRIORITY_CONFIG } from '@/config/status';
import { cn } from '@/lib/utils';

/** Filled bars per level — a signal-strength read of urgency. */
const LEVEL: Record<Priority, number> = { HIGH: 3, NORMAL: 2, LOW: 1 };
const BAR_HEIGHTS = ['5px', '8px', '11px'];

/**
 * HIGH / NORMAL / LOW chip — control-room "level meter": a 3-segment signal bar
 * (filled to the priority level) + a tracked-out monospace readout, matched to
 * StatusBadge so the grid's status & priority columns read as one family.
 */
export function PriorityChip({ priority, className }: { priority: Priority; className?: string }) {
  const p = PRIORITY_CONFIG[priority];
  const level = LEVEL[priority];
  return (
    <span
      title={`${priority} priority`}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] border py-[3px] pl-1.5 pr-2',
        'font-mono text-[10px] font-medium uppercase leading-none tracking-[0.09em]',
        className,
      )}
      style={{ color: p.text, backgroundColor: p.bg, borderColor: p.border }}
    >
      <span aria-hidden className="flex items-end gap-px">
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className="w-[2px] rounded-[1px]"
            style={{ height: h, backgroundColor: p.text, opacity: i < level ? 1 : 0.25 }}
          />
        ))}
      </span>
      {p.label}
    </span>
  );
}

import { CheckCircle2, AlertTriangle, XCircle, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast / Alert — 4 semantic types (success/warning/error/info), left-accent bar
 * matching the Design System prototype's toast component.
 */
export type AlertTone = 'success' | 'warning' | 'error' | 'info';

const TONES: Record<
  AlertTone,
  { accent: string; title: string; bg: string; border: string; icon: LucideIcon }
> = {
  success: { accent: '#3FBF8E', title: '#3FBF8E', bg: 'rgba(30,138,99,0.08)', border: 'rgba(30,138,99,0.2)', icon: CheckCircle2 },
  warning: { accent: '#FBBF24', title: '#FBBF24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: AlertTriangle },
  error: { accent: '#F87171', title: '#F87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: XCircle },
  info: { accent: '#60A5FA', title: '#60A5FA', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: Info },
};

export function Alert({
  tone = 'info',
  title,
  children,
  time,
  className,
}: {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
  time?: string;
  className?: string;
}) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div
      className={cn('flex items-start gap-3 rounded-[10px] border border-l-[3px] px-3.5 py-3', className)}
      style={{ backgroundColor: t.bg, borderColor: t.border, borderLeftColor: t.accent }}
    >
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: t.accent }} />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-bold" style={{ color: t.title }}>
          {title}
        </div>
        {children && <div className="mt-0.5 text-[11.5px] leading-relaxed text-text-muted">{children}</div>}
      </div>
      {time && <span className="shrink-0 font-mono text-[10px] text-text-muted">{time}</span>}
    </div>
  );
}

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/** Text input matching the prototype field (default / focus ring / error). */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-[9px] border bg-surface-0 px-3 text-xs text-text-primary outline-none transition placeholder:text-text-muted',
        'focus:border-accent focus:shadow-[0_0_0_3px_rgba(30,138,99,0.12)]',
        invalid
          ? 'border-error/45 text-[#F87171] focus:border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
          : 'border-border',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button — 4 variants (Primary/Secondary/Ghost/Danger) × states
 * (Default/Hover/Loading/Disabled), matching the Design System prototype.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-white shadow-[0_2px_8px_rgba(30,138,99,0.28)] hover:bg-accent-hover',
        secondary:
          'border border-border bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary',
        ghost: 'border border-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary',
        danger:
          'border border-error/30 bg-error/10 text-[#F87171] hover:bg-error/20',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-9 px-4',
        lg: 'h-10 px-5 text-[13px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export { buttonVariants };

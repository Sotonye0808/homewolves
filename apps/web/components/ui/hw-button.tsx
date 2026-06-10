'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hwButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-body font-semibold transition-all duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-foreground rounded-full shadow-sm hover:bg-[var(--color-brand-accent-alt)] hover:shadow-md hover:-translate-y-px',
        secondary:
          'bg-secondary text-secondary-foreground rounded-full shadow-sm hover:brightness-110 hover:shadow-md hover:-translate-y-px',
        ghost:
          'bg-transparent text-foreground rounded-full hover:bg-[var(--color-border-subtle)]',
        outline:
          'bg-transparent border border-border text-foreground rounded-full hover:bg-[var(--color-border-subtle)]',
        cta: 'bg-accent text-accent-foreground rounded-full shadow-md hover:bg-[var(--color-brand-accent-alt)] hover:shadow-lg hover:-translate-y-0.5 text-lg',
      },
      size: {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-5 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-10 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface HwButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof hwButtonVariants> {}

const HwButton = forwardRef<HTMLButtonElement, HwButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(hwButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
HwButton.displayName = 'HwButton';

export { HwButton, hwButtonVariants };
export type { HwButtonProps };

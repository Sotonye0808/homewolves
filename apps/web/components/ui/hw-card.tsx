import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hwCardVariants = cva(
  'rounded-lg overflow-hidden transition-all duration-normal ease-out',
  {
    variants: {
      variant: {
        elevated:
          'bg-elevated border border-subtle shadow-card hover:shadow-hover hover:-translate-y-1',
        glass:
          'glass-surface',
        default:
          'bg-elevated border border-subtle shadow-xs',
      },
    },
    defaultVariants: {
      variant: 'elevated',
    },
  },
);

interface HwCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof hwCardVariants> {}

function HwCard({ className, variant, ...props }: HwCardProps) {
  return (
    <div className={cn(hwCardVariants({ variant, className }))} {...props} />
  );
}

export { HwCard, hwCardVariants };
export type { HwCardProps };

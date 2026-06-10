import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hwBadgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        sale: 'bg-[#DBEAFE] text-[#1D4ED8]',
        rent: 'bg-[#D1FAE5] text-[#065F46]',
        verified: 'bg-[#D1FAE5] text-[#065F46]',
        pending: 'bg-[#FEF3C7] text-[#B45309]',
        default: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface HwBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof hwBadgeVariants> {}

function HwBadge({ className, variant, ...props }: HwBadgeProps) {
  return (
    <span className={cn(hwBadgeVariants({ variant, className }))} {...props} />
  );
}

export { HwBadge, hwBadgeVariants };
export type { HwBadgeProps };

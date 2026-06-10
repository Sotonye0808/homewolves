'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface HwInputProps extends InputHTMLAttributes<HTMLInputElement> {
  glass?: boolean;
}

const HwInput = forwardRef<HTMLInputElement, HwInputProps>(
  ({ className, glass = true, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-transparent font-body text-foreground outline-none placeholder:text-muted-foreground',
          glass &&
            'bg-glass/55 backdrop-blur-lg border border-glass shadow-glass rounded-full px-4 py-2',
          className,
        )}
        {...props}
      />
    );
  },
);
HwInput.displayName = 'HwInput';

export { HwInput };
export type { HwInputProps };

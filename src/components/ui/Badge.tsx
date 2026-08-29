import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
  {
    variants: {
      variant: {
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning-700',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        neutral: 'bg-white text-neutral-600',
        primary: 'bg-primary/10 text-primary',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

export function Badge({ className, variant, size, showDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {showDot && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', {
          'bg-success': variant === 'success',
          'bg-warning': variant === 'warning',
          'bg-error': variant === 'error',
          'bg-info': variant === 'info',
          'bg-neutral-600': variant === 'neutral',
          'bg-primary': variant === 'primary',
        })} />
      )}
      {children}
    </div>
  );
}

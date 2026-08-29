import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

const progressBarVariants = cva('h-full w-full flex-1 transition-all', {
  variants: {
    variant: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      accent: 'bg-accent',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export interface ProgressBarProps extends VariantProps<typeof progressBarVariants> {
  value: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, variant, size = 'md', showLabel, className }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-caption font-medium text-neutral-600">
          <span>Progress</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-white', heightClasses[size])}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={cn(progressBarVariants({ variant }))}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/utils/cn';

export interface ConfidenceMeterProps {
  value: number; // 0-1 or 0-100
  className?: string;
}

export function ConfidenceMeter({ value, className }: ConfidenceMeterProps) {
  // Normalize value to 0-100
  const percentage = value <= 1 ? value * 100 : value;
  const clampedValue = Math.min(100, Math.max(0, percentage));

  let colorClass = 'bg-error';
  let label = 'Needs Review';

  if (clampedValue >= 85) {
    colorClass = 'bg-success';
    label = 'High Confidence';
  } else if (clampedValue >= 60) {
    colorClass = 'bg-warning';
    label = 'Moderate Confidence';
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)} role="meter" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${label}: ${clampedValue.toFixed(0)}%`}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-neutral-700">{label}</span>
        <span className="text-neutral-500">{clampedValue.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", colorClass)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

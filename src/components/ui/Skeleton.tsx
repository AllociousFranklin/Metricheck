import React from 'react';
import { cn } from '@/utils/cn';

export function SkeletonLine({
  className,
  width = '100%',
  height = '1rem',
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200', className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-neutral-100 bg-white p-6 shadow-sm', className)}>
      <SkeletonLine width="60%" height="1.5rem" className="mb-4" />
      <div className="space-y-2">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('w-full border rounded-lg overflow-hidden border-neutral-100 bg-white', className)}>
      <div className="border-b border-neutral-100 bg-neutral-25 px-4 py-3 flex gap-4">
        <SkeletonLine width="20%" />
        <SkeletonLine width="40%" />
        <SkeletonLine width="20%" />
        <SkeletonLine width="20%" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-neutral-100 px-4 py-4 flex gap-4 last:border-0">
          <SkeletonLine width="20%" />
          <SkeletonLine width="40%" />
          <SkeletonLine width="20%" />
          <SkeletonLine width="20%" />
        </div>
      ))}
    </div>
  );
}

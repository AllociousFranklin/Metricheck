import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-25 text-neutral-500">
        <Icon size={32} />
      </div>
      <h3 className="mb-1 text-h3 font-semibold text-neutral-900">{title}</h3>
      <p className="mb-6 max-w-sm text-body text-neutral-600">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

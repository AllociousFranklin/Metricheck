import React from 'react';
import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconPrefix?: LucideIcon;
  iconSuffix?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, iconPrefix: IconPrefix, iconSuffix: IconSuffix, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="text-label text-neutral-900 font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {IconPrefix && (
            <div className="absolute left-3 text-neutral-600">
              <IconPrefix size={18} />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-body text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              IconPrefix && 'pl-10',
              IconSuffix && 'pr-10',
              error && 'border-error focus-visible:ring-error',
              className
            )}
            {...props}
          />
          {IconSuffix && (
            <div className="absolute right-3 text-neutral-600">
              <IconSuffix size={18} />
            </div>
          )}
        </div>
        {error && <p className="text-caption text-error">{error}</p>}
        {helperText && !error && <p className="text-caption text-neutral-600">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

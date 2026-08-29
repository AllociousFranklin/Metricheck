import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="flex flex-col w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="text-label text-neutral-900 font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-10 w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-10 text-body text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              error && 'border-error focus-visible:ring-error',
              className
            )}
            {...props}
          >
            <option value="" disabled hidden>Select...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-600">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && <p className="text-caption text-error">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

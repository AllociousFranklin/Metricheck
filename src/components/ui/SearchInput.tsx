import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({ className, onChange, debounceMs = 300, value: externalValue, defaultValue, ...props }: SearchInputProps) {
  const [value, setValue] = useState((externalValue || defaultValue || '') as string);

  useEffect(() => {
    if (externalValue !== undefined) {
      setValue(externalValue as string);
    }
  }, [externalValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) {
        onChange(value);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [value, debounceMs, onChange]);

  const handleClear = () => {
    setValue('');
    if (onChange && debounceMs === 0) {
      onChange('');
    }
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <div className="absolute left-3 text-neutral-500 pointer-events-none">
        <Search size={18} />
      </div>
      <input
        type="text"
        className="flex h-10 w-full rounded-md border border-neutral-300 bg-white pl-10 pr-10 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-neutral-500 hover:text-neutral-900 focus:outline-none focus:text-neutral-900"
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

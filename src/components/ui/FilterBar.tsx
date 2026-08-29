import React from 'react';
import { Select } from './Select';
import { SearchInput } from './SearchInput';
import { Button } from './Button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function FilterBar({
  filters,
  values,
  onFilterChange,
  onClearAll,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  className,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== '');

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end ${className || ''}`}>
      {onSearchChange && (
        <div className="w-full sm:w-64 sm:flex-shrink-0">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={onSearchChange}
          />
        </div>
      )}
      
      <div className="flex flex-1 flex-wrap gap-3 items-end">
        {filters.map((filter) => (
          <div key={filter.key} className="w-full sm:w-auto sm:min-w-[150px]">
            <Select
              aria-label={filter.label}
              value={values[filter.key] || ''}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              options={[{ value: '', label: filter.label }, ...filter.options]}
            />
          </div>
        ))}
        
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearAll} className="h-10 text-sm">
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SkeletonTable } from './Skeleton';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  hiddenOnMobile?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  striped?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data available',
  emptyAction,
  onRowClick,
  keyExtractor,
  striped,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (index: number, column: Column<T>) => {
    if (!column.sortable) return;
    
    setSortConfig(current => {
      if (current?.key === index) {
        if (current.direction === 'asc') return { key: index, direction: 'desc' };
        return null; // clear sort
      }
      return { key: index, direction: 'asc' };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    const { key, direction } = sortConfig;
    const column = columns[key];
    
    return [...data].sort((a, b) => {
      let aVal = typeof column.accessor === 'function' ? column.accessor(a) : a[column.accessor];
      let bVal = typeof column.accessor === 'function' ? column.accessor(b) : b[column.accessor];
      
      if (aVal === bVal) return 0;
      
      // Basic string/number sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (aVal === null || aVal === undefined) return direction === 'asc' ? -1 : 1;
      if (bVal === null || bVal === undefined) return direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, columns]);

  if (isLoading) {
    return <SkeletonTable rows={5} className={className} />;
  }

  if (data.length === 0) {
    return (
      <div className={cn("w-full border rounded-lg border-neutral-200 bg-white p-8 flex flex-col items-center justify-center text-center", className)}>
        <p className="text-neutral-500 mb-4">{emptyMessage}</p>
        {emptyAction && <div>{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-neutral-200 bg-white", className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-25 text-neutral-600 border-b border-neutral-200">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={cn(
                  "px-4 py-3 font-medium",
                  col.sortable && "cursor-pointer hover:bg-white select-none",
                  col.hiddenOnMobile && "hidden sm:table-cell"
                )}
                style={{ width: col.width }}
                onClick={() => handleSort(idx, col)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-neutral-500">
                      {sortConfig?.key === idx ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-neutral-900" /> : <ArrowDown size={14} className="text-neutral-900" />
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {sortedData.map((row, rowIdx) => (
            <tr 
              key={keyExtractor(row)} 
              onClick={() => onRowClick?.(row)}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-neutral-25 transition-colors",
                striped && rowIdx % 2 === 1 && "bg-neutral-25/50"
              )}
            >
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  className={cn(
                    "px-4 py-3 text-neutral-900",
                    col.hiddenOnMobile && "hidden sm:table-cell"
                  )}
                >
                  {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

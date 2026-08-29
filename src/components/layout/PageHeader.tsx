import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className,
}) => {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-neutral-600 mb-3 overflow-x-auto whitespace-nowrap pb-1">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <React.Fragment key={crumb.label}>
                {crumb.href && !isLast ? (
                  <Link 
                    to={crumb.href} 
                    className="hover:text-primary hover:underline transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && "text-neutral-900 font-medium")}>
                    {crumb.label}
                  </span>
                )}
                
                {!isLast && (
                  <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm sm:text-base text-neutral-600">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

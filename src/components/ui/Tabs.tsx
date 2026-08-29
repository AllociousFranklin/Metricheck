import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className, ariaLabel = "Tabs" }: { children: React.ReactNode; className?: string; ariaLabel?: string }) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!listRef.current) return;
    const tabs = Array.from(listRef.current.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const index = tabs.findIndex(tab => tab === document.activeElement);
    if (index === -1) return;

    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    
    if (nextIndex !== index) {
      e.preventDefault();
      tabs[nextIndex].focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn('flex w-full border-b border-neutral-200', className)}
    >
      {children}
    </div>
  );
}

export function Tab({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        isActive
          ? 'border-b-2 border-accent text-accent'
          : 'border-b-2 border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');
  const { activeTab } = context;

  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn('pt-4 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2', className)}
    >
      {children}
    </div>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Plus, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-neutral-100 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-25 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LM</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">METRICHECK</h1>
            <p className="text-[10px] text-neutral-600 font-medium">Compliance Platform</p>
          </div>
        </Link>
      </div>

      {/* Desktop Logo (Invisible on desktop since sidebar covers left side, but good for flex spacing) */}
      <div className="hidden lg:block flex-1" />

      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        <Link
          to="/inspections/new"
          className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Inspection
        </Link>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-25 transition-colors"
          >
            <div className="w-9 h-9 bg-primary-100 text-primary rounded-full flex items-center justify-center font-semibold text-sm border border-primary-200">
              {getInitials(user?.name)}
            </div>
            <div className="hidden md:block text-left mr-1">
              <p className="text-sm font-medium text-neutral-900 leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-neutral-600 mt-1">{user?.role || 'Inspector'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-600 hidden md:block" />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 rounded-lg shadow-lg z-50 py-1">
                <div className="px-4 py-3 border-b border-neutral-100 md:hidden">
                  <p className="text-sm font-medium text-neutral-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{user?.role || 'Inspector'}</p>
                </div>
                <div className="px-4 py-2">
                  <p className="text-xs text-neutral-600 font-medium uppercase tracking-wider">Account</p>
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-25 flex items-center gap-2"
                  onClick={() => {
                    setDropdownOpen(false);
                    // Navigate to profile
                  }}
                >
                  <UserIcon className="w-4 h-4 text-neutral-600" />
                  My Profile
                </button>
                <div className="h-px bg-white my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-neutral-25 flex items-center gap-2"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

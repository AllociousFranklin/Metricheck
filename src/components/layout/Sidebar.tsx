import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Package, 
  AlertTriangle, 
  FileText, 
  BarChart3, 
  Settings, 
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ClipboardCheck, label: 'Inspections', path: '/inspections' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: AlertTriangle, label: 'Violations', path: '/violations' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const sidebarVariants = {
    closed: { x: '-100%' },
    open: { x: 0 },
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-neutral-100 overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b border-neutral-100 sticky top-0 bg-white z-10 shrink-0">
        <Link to="/" className="flex items-center gap-3 w-full" onClick={() => onClose()}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">LM</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-tight">METRICHECK</h1>
            <p className="text-[10px] text-neutral-600 font-medium truncate">Compliance Platform</p>
          </div>
        </Link>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-25"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 lg:hidden">
        <Link
          to="/inspections/new"
          onClick={onClose}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full"
        >
          <Plus className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onClose()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
                isActive 
                  ? "bg-primary-50 text-primary border-r-2 border-primary" 
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-25"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-neutral-500 group-hover:text-neutral-700")} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 mt-auto shrink-0 border-t border-neutral-100">
        <NavLink
          to="/settings"
          onClick={() => onClose()}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
              isActive 
                ? "bg-primary-50 text-primary border-r-2 border-primary" 
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-25"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings className={cn("w-5 h-5", isActive ? "text-primary" : "text-neutral-500 group-hover:text-neutral-700")} />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40">
        <SidebarContent />
      </aside>
    </>
  );
};

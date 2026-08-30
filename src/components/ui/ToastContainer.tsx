import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variants = {
  success: 'border-l-4 border-success bg-white',
  error: 'border-l-4 border-error bg-white',
  warning: 'border-l-4 border-warning bg-white',
  info: 'border-l-4 border-info bg-white',
};

const iconColors = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-0 right-0 z-50 flex flex-col p-4 space-y-4 max-w-sm w-full sm:p-6"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                'pointer-events-auto flex w-full overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5',
                variants[toast.type]
              )}
            >
              <div className="p-4 w-full flex items-start">
                <div className="flex-shrink-0">
                  <Icon className={cn('h-5 w-5', iconColors[toast.type])} aria-hidden="true" />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5 text-left">
                  {toast.title && <p className="text-sm font-semibold text-neutral-900 mb-0.5">{toast.title}</p>}
                  <p className="text-xs text-neutral-600">{toast.message}</p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-white text-neutral-500 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    onClick={() => removeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

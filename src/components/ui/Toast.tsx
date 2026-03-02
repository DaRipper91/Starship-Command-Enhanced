import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

import { Toast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'animate-in slide-in-from-bottom-5 flex min-w-[300px] items-center gap-3 rounded-lg border p-4 shadow-lg transition-all',
            toast.type === 'success' &&
              'border-green-800 bg-green-900/90 text-green-100',
            toast.type === 'error' &&
              'border-red-800 bg-red-900/90 text-red-100',
            toast.type === 'info' &&
              'border-blue-800 bg-blue-900/90 text-blue-100',
          )}
        >
          {toast.type === 'success' && (
            <CheckCircle size={18} className="shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle size={18} className="shrink-0" />
          )}
          {toast.type === 'info' && <Info size={18} className="shrink-0" />}

          <p className="flex-1 text-sm font-medium">{toast.message}</p>

          <button
            onClick={() => onRemove(toast.id)}
            className="rounded p-1 opacity-70 hover:bg-black/20 hover:opacity-100"
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

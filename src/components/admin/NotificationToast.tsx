import React, { useEffect } from 'react';

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((type: ToastType, message: string) => {
    const id = String(++nextId);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export default function NotificationToast({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const bgMap: Record<ToastType, string> = {
  error: 'bg-red-900/90 border-red-700',
  success: 'bg-emerald-900/90 border-emerald-700',
  info: 'bg-gray-800/90 border-gray-600',
};

const iconMap: Record<ToastType, string> = {
  error: '✕',
  success: '✓',
  info: 'i',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto cursor-pointer border rounded-lg px-4 py-3 text-sm text-white shadow-lg animate-in slide-in-from-right-2 fade-in duration-200 flex items-start gap-3 ${bgMap[toast.type]}`}
    >
      <span className="font-mono text-xs leading-5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center border border-current/30">
        {iconMap[toast.type]}
      </span>
      <span className="leading-5">{toast.message}</span>
    </div>
  );
}

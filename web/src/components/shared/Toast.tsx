'use client';

import { useEffect, useState } from 'react';
import { generateId } from '@/lib/uuid';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

let addToastFn: ((text: string, type?: ToastMessage['type']) => void) | null = null;

export function showToast(text: string, type: ToastMessage['type'] = 'success') {
  addToastFn?.(text, type);
}

const colors: Record<string, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (text, type = 'success') => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colors[t.type]} text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-slide-in`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

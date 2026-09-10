'use client';

import { ReactNode, useEffect } from 'react';

export default function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start md:items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-panel border border-line rounded-lg shadow-panel w-full max-w-md p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate hover:text-ink text-lg leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

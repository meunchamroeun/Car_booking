'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Check, X, Info } from 'lucide-react';

export function ToastDeck() {
  const { toasts } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-deck">
      {toasts.map(t => {
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;
        if (t.type === 'success') {
          icon = <Check className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (t.type === 'error') {
          icon = <X className="w-4 h-4 text-rose-400 shrink-0" />;
        }

        return (
          <div key={t.id} className={`ppwsa-toast show ${t.type}`}>
            <span className="shrink-0">{icon}</span>
            <span className="flex-1 text-xs font-semibold leading-snug">{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

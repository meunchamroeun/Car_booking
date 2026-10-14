'use client';

import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-[430px] flex-col gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)]" aria-live="polite">
      {toasts.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className="pointer-events-auto flex w-full animate-toast-in items-start gap-2.5 rounded-2xl border bg-card/95 px-3.5 py-3 text-left text-[13.5px] font-medium shadow-float backdrop-blur"
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="mt-px size-[18px] shrink-0 text-success" />
          ) : t.type === 'error' ? (
            <XCircle className="mt-px size-[18px] shrink-0 text-destructive" />
          ) : (
            <Info className="mt-px size-[18px] shrink-0 text-primary" />
          )}
          <span className={cn('flex-1', t.type === 'error' && 'text-destructive')}>{t.msg}</span>
        </button>
      ))}
    </div>
  );
}

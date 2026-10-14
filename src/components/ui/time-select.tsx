'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 30-minute steps between 07:00 and 20:00 — easier to tap than a native time wheel. */
export const TIME_OPTIONS = Array.from({ length: 27 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${mins % 60 ? '30' : '00'}`;
});

export function TimeSelect({ value, onChange, label, min, className }: { value: string; onChange: (v: string) => void; label: string; min?: string; className?: string }) {
  return (
    <label className={cn('relative block', className)}>
      <span className="pointer-events-none absolute left-3.5 top-1.5 text-[11px] font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-[52px] w-full appearance-none rounded-xl border border-input bg-card pl-3.5 pr-9 pt-4 text-[16px] font-semibold tabular focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/12"
      >
        {TIME_OPTIONS.map(t => (
          <option key={t} value={t} disabled={!!min && t <= min}>
            {t}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </label>
  );
}

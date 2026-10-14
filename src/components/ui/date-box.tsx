'use client';

import { CalendarDays } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

/** Tappable date field showing "Thu 15 Oct"; opens the app's calendar (no native picker). */
export function DateBox({ label, value, lang, active, onClick }: { label: string; value: string; lang: 'en' | 'kh'; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={cn(
        'relative flex h-[56px] items-center justify-between rounded-xl border bg-card pl-3.5 pr-3 pt-4 text-left transition-[border-color,box-shadow]',
        active ? 'border-primary ring-[3px] ring-primary/15' : 'border-input hover:border-primary/40'
      )}
    >
      <span className="absolute left-3.5 top-1.5 text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="truncate text-[15px] font-bold">{DateUtil.longDate(value, lang).replace(/^.*, /, '')}</span>
      <CalendarDays className={cn('-mt-4 size-[18px] shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
    </button>
  );
}


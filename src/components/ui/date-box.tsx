'use client';

import { CalendarDays } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

/** Tappable date field showing "Thu 15 Oct"; opens the app's calendar (no native picker). */
export function DateBox({
  label,
  value,
  lang,
  active,
  onClick,
  required,
}: {
  label: string;
  value: string;
  lang: 'en' | 'kh';
  active: boolean;
  onClick: () => void;
  required?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={cn(
        'relative flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-card pl-3 pr-2.5 pt-3.5 text-left transition-[border-color,box-shadow]',
        active ? 'border-primary ring-[3px] ring-primary/15' : 'border-input hover:border-primary/40'
      )}
    >
      <span className="absolute left-3 top-1.5 text-[10.5px] font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      <span className="min-w-0 truncate text-[13.5px] font-semibold">{DateUtil.longDate(value, lang).replace(/^.*, /, '')}</span>
      <CalendarDays className={cn('-mt-3.5 size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
    </button>
  );
}


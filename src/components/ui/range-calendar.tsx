'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export type DayMark = 'booked' | 'service' | undefined;

/**
 * Month calendar for picking a date range: first tap sets the start, second tap sets the end.
 * Tapping a day before the start (or tapping again after a full range) starts a new range.
 */
export function RangeCalendar({
  start,
  end,
  onChange,
  min,
  maxDays = 14,
  markDay,
  lang = 'en',
  onDone,
  labels,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  min: string;
  maxDays?: number;
  /** Optional per-day hint: a dot for "booked", disabled for "service". */
  markDay?: (date: string) => DayMark;
  lang?: 'en' | 'kh';
  /** Called once both ends are chosen. */
  onDone?: () => void;
  labels?: { pickStart: string; pickEnd: string; booked: string; unavailable: string };
}) {
  const L = labels ?? { pickStart: '① Tap start date', pickEnd: '② Tap end date', booked: 'Car partly booked', unavailable: 'Unavailable' };
  const [picking, setPicking] = React.useState<'start' | 'end'>('start');
  const [month, setMonth] = React.useState(() => start.slice(0, 7));
  const [hover, setHover] = React.useState<string | null>(null);

  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${DateUtil.pad(i + 1)}`),
  ];
  while (cells.length % 7) cells.push(null);

  const locale = lang === 'kh' ? 'km-KH' : 'en-GB';
  const monthLabel = first.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  const shift = (n: number) => {
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${DateUtil.pad(d.getMonth() + 1)}`);
  };
  const canPrev = month > min.slice(0, 7);

  const latestEnd = DateUtil.addDays(start, maxDays);
  const previewEnd = picking === 'end' && hover && hover >= start && hover <= latestEnd ? hover : end;

  const pick = (d: string) => {
    if (picking === 'start' || d < start) {
      onChange(d, d);
      setPicking('end');
    } else {
      onChange(start, d);
      setPicking('start');
      onDone?.();
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-3" onMouseLeave={() => setHover(null)}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className="flex size-9 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30" aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="text-[14.5px] font-bold">{monthLabel}</p>
          <p className="text-[11.5px] font-medium text-primary">{picking === 'start' ? L.pickStart : L.pickEnd}</p>
        </div>
        <button type="button" onClick={() => shift(1)} className="flex size-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Next month">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
        {weekdays.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1" role="grid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const mark = markDay?.(d);
          const tooLate = picking === 'end' && d > latestEnd;
          const disabled = d < min || mark === 'service' || tooLate;
          const isStart = d === start;
          const isEnd = d === previewEnd;
          const inRange = d > start && d < previewEnd;
          const isToday = d === DateUtil.todayStr();
          const col = i % 7;
          return (
            <div
              key={d}
              className={cn(
                'relative flex h-11 items-center justify-center',
                // continuous range band behind the day buttons
                (inRange || (isStart && previewEnd > start) || (isEnd && previewEnd > start)) && 'bg-primary-soft',
                isStart && previewEnd > start && 'rounded-l-full',
                isEnd && previewEnd > start && 'rounded-r-full',
                inRange && col === 0 && 'rounded-l-full',
                inRange && col === 6 && 'rounded-r-full'
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => pick(d)}
                onMouseEnter={() => setHover(d)}
                aria-pressed={isStart || isEnd}
                aria-label={d}
                className={cn(
                  'relative flex size-10 flex-col items-center justify-center rounded-full text-[14px] font-semibold tabular transition-colors disabled:cursor-not-allowed',
                  isStart || isEnd ? 'bg-primary text-primary-foreground' : inRange ? 'text-primary' : 'hover:bg-muted',
                  disabled && 'text-muted-foreground/35 line-through decoration-1',
                  isToday && !(isStart || isEnd) && 'ring-1 ring-inset ring-primary/40'
                )}
              >
                {Number(d.slice(8))}
                {mark === 'booked' && !disabled && (
                  <span className={cn('absolute bottom-1 size-1 rounded-full', isStart || isEnd ? 'bg-primary-foreground' : 'bg-warning')} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t pt-2 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning" /> {L.booked}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="line-through">15</span> {L.unavailable}
        </span>
      </div>
    </div>
  );
}

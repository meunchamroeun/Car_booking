'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

const showDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

/** "22102026" → "22/10/2026" while typing; "0830" → "08:30". */
const maskDate = (digits: string) =>
  digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
const maskTime = (digits: string) => (digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);

/**
 * Date + time you can type (dd/mm/yyyy and HH:MM; separators are added while typing),
 * with a calendar icon that opens the app's calendar. A value is applied as soon as it is complete and valid.
 */
export function DateTimeBox({
  label,
  date,
  time,
  min,
  onDate,
  onTime,
  onCalendar,
  active,
  invalid,
  dateLabel,
  timeLabel,
  calendarLabel,
}: {
  label: string;
  date: string;
  /** Leave out to show the date only. */
  time?: string;
  /** Earliest date allowed (yyyy-mm-dd). */
  min: string;
  onDate: (date: string) => void;
  onTime?: (time: string) => void;
  onCalendar: () => void;
  active?: boolean;
  invalid?: boolean;
  dateLabel: string;
  timeLabel?: string;
  calendarLabel: string;
}) {
  const [dText, setDText] = React.useState(showDate(date));
  const [tText, setTText] = React.useState(time ?? '');
  const [badDate, setBadDate] = React.useState(false);
  const [badTime, setBadTime] = React.useState(false);
  React.useEffect(() => (setDText(showDate(date)), setBadDate(false)), [date]);
  React.useEffect(() => (setTText(time ?? ''), setBadTime(false)), [time]);

  const parseDate = (digits: string) => {
    if (digits.length !== 8) return null;
    const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
    const d = new Date(`${iso}T00:00`);
    return !isNaN(d.getTime()) && DateUtil.toDateStr(d) === iso && iso >= min ? iso : null;
  };
  const parseTime = (digits: string) => {
    if (digits.length !== 4) return null;
    const h = Number(digits.slice(0, 2));
    const m = Number(digits.slice(2));
    return h < 24 && m < 60 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : null;
  };

  const typeDate = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setDText(maskDate(digits));
    const iso = parseDate(digits);
    setBadDate(digits.length === 8 && !iso);
    if (iso) onDate(iso);
  };
  const typeTime = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setTText(maskTime(digits));
    const t = parseTime(digits);
    setBadTime(digits.length === 4 && !t);
    if (t) onTime?.(t);
  };

  const field = 'min-w-0 bg-transparent font-semibold tabular outline-none focus-visible:ring-0 focus-visible:ring-offset-0';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-2.5 pb-1.5 pt-1 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15',
        active ? 'border-primary ring-[3px] ring-primary/15' : invalid || badDate || badTime ? 'border-destructive' : 'border-input'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-medium text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={onCalendar}
          aria-label={calendarLabel}
          className={cn('-mr-1 flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted', active ? 'text-primary' : 'text-muted-foreground')}
        >
          <CalendarDays className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 text-[13px]">
        <input
          value={dText}
          onChange={e => typeDate(e.target.value)}
          onBlur={() => (setDText(showDate(date)), setBadDate(false))}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          aria-label={`${label} · ${dateLabel}`}
          aria-invalid={badDate}
          className={cn(field, 'w-[78px] flex-1', badDate && 'text-destructive')}
        />
        {time !== undefined && (
        <input
          value={tText}
          onChange={e => typeTime(e.target.value)}
          onBlur={() => (setTText(time), setBadTime(false))}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
          inputMode="numeric"
          placeholder="hh:mm"
          aria-label={`${label} · ${timeLabel}`}
          aria-invalid={badTime}
          className={cn(field, 'w-[50px] shrink-0 rounded-md bg-muted/70 px-1 py-0.5 text-center', badTime && 'text-destructive')}
        />
        )}
      </div>
    </div>
  );
}

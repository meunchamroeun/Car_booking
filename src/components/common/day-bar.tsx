'use client';

import { Booking } from '@/types';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export const DAY_START = 8;
export const DAY_END = 18;

/** Compact 08–18 availability bar: free = track, booked = filled segments, "now" marker for today. */
export function DayBar({
  bookings,
  date,
  maintenance,
  className,
  highlight,
}: {
  bookings: Booking[];
  date: string;
  maintenance?: boolean;
  className?: string;
  /** Window being booked, drawn as an outlined block (green when free, red when clashing). */
  highlight?: { start: string; end: string; ok: boolean };
}) {
  const span = (DAY_END - DAY_START) * 60;
  const pct = (time: string) => Math.min(100, Math.max(0, ((DateUtil.toMins(time) - DAY_START * 60) / span) * 100));
  const isToday = date === DateUtil.todayStr();
  const now = pct(DateUtil.nowTimeStr());

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn('relative overflow-hidden rounded-full bg-success/20', highlight ? 'h-3' : 'h-2')}>
        {maintenance ? (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,hsl(var(--warning)/0.55)_0_5px,hsl(var(--warning)/0.25)_5px_10px)]" />
        ) : (
          bookings.map(b => (
            <div
              key={b.id}
              className={cn('absolute inset-y-0 rounded-full', b.status === 'Completed' ? 'bg-muted-foreground/40' : 'bg-primary')}
              style={{ left: `${pct(b.startTime)}%`, width: `${Math.max(2, pct(b.endTime) - pct(b.startTime))}%` }}
            />
          ))
        )}
        {highlight && (
          <div
            className={cn('absolute inset-y-0 rounded-full border-2', highlight.ok ? 'border-success bg-success/35' : 'border-destructive bg-destructive/30')}
            style={{ left: `${pct(highlight.start)}%`, width: `${Math.max(2, pct(highlight.end) - pct(highlight.start))}%` }}
          />
        )}
        {isToday && now > 0 && now < 100 && <div className="absolute inset-y-[-2px] w-0.5 bg-foreground/70" style={{ left: `${now}%` }} />}
      </div>
      <div className="flex justify-between text-[10px] font-medium tabular text-muted-foreground">
        <span>08</span>
        <span>10</span>
        <span>12</span>
        <span>14</span>
        <span>16</span>
        <span>18</span>
      </div>
    </div>
  );
}

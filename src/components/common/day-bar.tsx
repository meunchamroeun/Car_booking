'use client';

import * as React from 'react';
import { Booking } from '@/types';
import { ChevronRight, X } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { useApp } from '@/lib/store';
import { can } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from '@/components/common/status';

export const DAY_START = 8;
export const DAY_END = 18;

type Selection = { kind: 'booking'; id: string } | { kind: 'free'; start: string; end: string } | { kind: 'yours' } | null;

/**
 * Compact 08–18 availability bar: free = track, booked = filled segments, "now" marker for today.
 * With `interactive`, every part can be tapped to show who booked it / the free window / your time
 * in a small card under the bar. Taps never bubble to the parent (e.g. a car card that books).
 */
export function DayBar({
  bookings,
  date,
  maintenance,
  className,
  highlight,
  interactive,
  onUseFree,
  allowOpenBooking = true,
}: {
  bookings: Booking[];
  date: string;
  maintenance?: boolean;
  className?: string;
  /** Window being booked, drawn as an outlined block (green when free, red when clashing). */
  highlight?: { start: string; end: string; ok: boolean; reason?: string | null };
  interactive?: boolean;
  /** Offer "Use this time" on a tapped free window. */
  onUseFree?: (start: string, end: string) => void;
  /** Show "View booking" in the detail card (off inside the booking form). */
  allowOpenBooking?: boolean;
}) {
  const app = useApp();
  const [sel, setSel] = React.useState<Selection>(null);
  React.useEffect(() => setSel(null), [date]);

  const span = (DAY_END - DAY_START) * 60;
  const pct = (time: string) => Math.min(100, Math.max(0, ((DateUtil.toMins(time) - DAY_START * 60) / span) * 100));
  const isToday = date === DateUtil.todayStr();
  const now = pct(DateUtil.nowTimeStr());
  const hhmm = (m: number) => `${DateUtil.pad(Math.floor(m / 60))}:${DateUtil.pad(m % 60)}`;

  // Free windows between bookings inside 08:00–18:00 (at least 15 min)
  const gaps = React.useMemo(() => {
    if (maintenance) return [];
    const taken = bookings
      .filter(b => b.status !== 'Completed' || b.actualEndTime)
      .map(b => [Math.max(DAY_START * 60, DateUtil.toMins(b.startTime)), Math.min(DAY_END * 60, DateUtil.toMins(b.endTime))] as const)
      .filter(([s, e]) => e > s)
      .sort((x, y) => x[0] - y[0]);
    const out: { start: string; end: string }[] = [];
    // Today: free time only counts from now on — the past can't be booked
    const nowM = DateUtil.toMins(DateUtil.nowTimeStr());
    let cur = date === DateUtil.todayStr() ? Math.max(DAY_START * 60, nowM) : DAY_START * 60;
    for (const [s, e] of taken) {
      if (s - cur >= 15) out.push({ start: hhmm(cur), end: hhmm(s) });
      cur = Math.max(cur, e);
    }
    if (DAY_END * 60 - cur >= 15) out.push({ start: hhmm(cur), end: hhmm(DAY_END * 60) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, maintenance, date]);

  const toggle = (next: NonNullable<Selection>) =>
    setSel(cur => (cur && JSON.stringify(cur) === JSON.stringify(next) ? null : next));
  const isSel = (k: NonNullable<Selection>) => !!sel && JSON.stringify(sel) === JSON.stringify(k);
  const seg = (start: string, end: string) => ({ left: `${pct(start)}%`, width: `${Math.max(2, pct(end) - pct(start))}%` });

  return (
    <div
      className={cn('space-y-1', className)}
      // keep taps on the bar from triggering the surrounding card (booking)
      onClick={interactive ? e => e.stopPropagation() : undefined}
      onKeyDown={interactive ? e => e.stopPropagation() : undefined}
    >
      <div className="relative">
        <div className={cn('relative overflow-hidden rounded-full bg-success/20', highlight || interactive ? 'h-3' : 'h-2')}>
          {/* Time already passed today: grey diagonal stripes (//////) */}
          {isToday && now > 0 && !maintenance && (
            <div className="absolute inset-y-0 left-0 bg-muted bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.38)_0_2px,transparent_2px_6px)]" style={{ width: `${now}%` }} aria-hidden />
          )}
          {maintenance ? (
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,hsl(var(--warning)/0.55)_0_5px,hsl(var(--warning)/0.25)_5px_10px)]" />
          ) : (
            bookings.map(b => (
              <div
                key={b.id}
                className={cn(
                  'absolute inset-y-0 rounded-full transition-[filter]',
                  b.status === 'Completed' ? 'bg-muted-foreground/40' : 'bg-primary',
                  isSel({ kind: 'booking', id: b.id }) && 'brightness-125'
                )}
                style={seg(b.startTime, b.endTime)}
              />
            ))
          )}
          {gaps.map(g =>
            isSel({ kind: 'free', ...g }) ? <div key={g.start} className="absolute inset-y-0 rounded-full bg-success/45" style={seg(g.start, g.end)} /> : null
          )}
          {highlight && (
            <div
              className={cn('absolute inset-y-0 rounded-full border-2', highlight.ok ? 'border-success bg-success/35' : 'border-destructive bg-destructive/30')}
              style={seg(highlight.start, highlight.end)}
            />
          )}
          {isToday && now > 0 && now < 100 && <div className="absolute inset-y-[-2px] w-0.5 bg-foreground/70" style={{ left: `${now}%` }} />}
        </div>

        {/* Tap targets: taller than the bar so they're easy to hit on a phone */}
        {interactive && !maintenance && (
          <div className="absolute inset-x-0 -inset-y-2.5">
            {gaps.map(g => (
              <button
                key={`f-${g.start}`}
                type="button"
                aria-label={`${app.t('lg_free')} ${g.start}–${g.end}`}
                onClick={() => toggle({ kind: 'free', ...g })}
                className="absolute inset-y-0"
                style={seg(g.start, g.end)}
              />
            ))}
            {bookings.map(b => (
              <button
                key={`b-${b.id}`}
                type="button"
                aria-label={`${app.t('lg_booked')} ${b.startTime}–${b.endTime}`}
                onClick={() => toggle({ kind: 'booking', id: b.id })}
                className="absolute inset-y-0"
                style={seg(b.startTime, b.endTime)}
              />
            ))}
            {highlight && (
              <button
                type="button"
                aria-label={`${app.t('lg_yours')} ${highlight.start}–${highlight.end}`}
                onClick={() => toggle({ kind: 'yours' })}
                className="absolute inset-y-0"
                style={seg(highlight.start, highlight.end)}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between text-[10px] font-medium tabular text-muted-foreground">
        <span>08</span>
        <span>10</span>
        <span>12</span>
        <span>14</span>
        <span>16</span>
        <span>18</span>
      </div>
      {interactive && sel && <SegmentDetail sel={sel} highlight={highlight} onClose={() => setSel(null)} onUseFree={onUseFree} allowOpenBooking={allowOpenBooking} />}
    </div>
  );
}

function SegmentDetail({
  sel,
  highlight,
  onClose,
  onUseFree,
  allowOpenBooking,
}: {
  sel: NonNullable<Selection>;
  highlight?: { start: string; end: string; ok: boolean; reason?: string | null };
  onClose: () => void;
  onUseFree?: (start: string, end: string) => void;
  allowOpenBooking: boolean;
}) {
  const { bookings, users, currentUser, t, lang, openSheet } = useApp();
  const shell = (children: React.ReactNode, tone: string) => (
    <div className={cn('relative mt-1.5 rounded-xl border p-2.5 pr-9 text-[12.5px] animate-in fade-in-0 slide-in-from-top-1 duration-200', tone)}>
      {children}
      <button type="button" onClick={onClose} aria-label={t('close')} className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
        <X className="size-4" />
      </button>
    </div>
  );

  if (sel.kind === 'free') {
    return shell(
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-5 shrink-0 rounded-full bg-success/40" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {t('lg_free')} · <span className="tabular">{sel.start}–{sel.end}</span>
          </p>
          <p className="text-muted-foreground">{t('seg_free_desc')}</p>
        </div>
        {onUseFree && (
          <Button size="sm" className="h-8 shrink-0" onClick={() => (onUseFree(sel.start, sel.end), onClose())}>
            {t('seg_use')}
          </Button>
        )}
      </div>,
      'bg-success-soft/60 border-success/30'
    );
  }

  if (sel.kind === 'yours' && highlight) {
    return shell(
      <div className="flex items-center gap-2.5">
        <span className={cn('h-3 w-5 shrink-0 rounded-full border-2', highlight.ok ? 'border-success bg-success/35' : 'border-destructive bg-destructive/30')} />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {highlight.ok ? t('lg_yours') : t('lg_clash')} · <span className="tabular">{highlight.start}–{highlight.end}</span>
          </p>
          <p className={highlight.ok ? 'text-muted-foreground' : 'text-destructive'}>{highlight.ok ? t('slot_free') : highlight.reason}</p>
        </div>
      </div>,
      highlight.ok ? 'bg-card' : 'bg-destructive-soft/60 border-destructive/30'
    );
  }

  if (sel.kind !== 'booking') return null;
  const b = bookings.find(x => x.id === sel.id);
  if (!b) return null;
  const who = users.find(u => u.id === b.requesterId);
  const mine = b.requesterId === currentUser.id;
  const canOpen = allowOpenBooking && (mine || can(currentUser, 'booking.view_all'));
  return shell(
    <div className="flex gap-2.5">
      <Avatar initials={who?.initials ?? '?'} seed={who?.id} src={who?.avatarUrl} className="size-8 text-[11px]" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 font-semibold text-foreground">
          <span className="text-[12px] font-normal text-muted-foreground">{t('booking_by')} : </span>
          {who?.name}
          <BookingStatusBadge b={b} />
        </p>
        <p className="tabular text-muted-foreground">{DateUtil.window(b, lang)}</p>
        {b.purpose && (
          <p className="mt-0.5 text-foreground/85 leading-snug break-words whitespace-normal">
            <span className="font-normal text-muted-foreground">{t('purpose')} : </span>
            {b.purpose}
          </p>
        )}
        {canOpen && (
          <button type="button" onClick={() => openSheet({ type: 'booking', id: b.id })} className="mt-1 flex items-center gap-0.5 font-semibold text-primary">
            {t('notif_view')} <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>,
    'bg-card'
  );
}

export type LegendKey = 'free' | 'booked' | 'returned' | 'yours' | 'clash' | 'now' | 'past' | 'service';

/** Swatches drawn with the exact same styles as the bar, so the key always matches. */
const SWATCH: Record<LegendKey, React.ReactNode> = {
  free: <span className="h-2.5 w-4 rounded-full bg-success/20" />,
  booked: <span className="h-2.5 w-4 rounded-full bg-primary" />,
  returned: <span className="h-2.5 w-4 rounded-full bg-muted-foreground/40" />,
  yours: <span className="h-2.5 w-4 rounded-full border-2 border-success bg-success/35" />,
  clash: <span className="h-2.5 w-4 rounded-full border-2 border-destructive bg-destructive/30" />,
  now: <span className="h-3 w-0.5 rounded-full bg-foreground/70" />,
  past: <span className="h-2.5 w-4 rounded-full bg-muted bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.38)_0_2px,transparent_2px_6px)]" />,
  service: <span className="h-2.5 w-4 rounded-full bg-[repeating-linear-gradient(45deg,hsl(var(--warning)/0.55)_0_3px,hsl(var(--warning)/0.25)_3px_6px)]" />,
};

export const legendLabels = (t: (k: string) => string): Record<LegendKey, string> => ({
  free: t('lg_free'),
  booked: t('lg_booked'),
  returned: t('lg_returned'),
  yours: t('lg_yours'),
  clash: t('lg_clash'),
  now: t('lg_now'),
  past: t('passed'),
  service: t('lg_service'),
});

/** Colour key for the availability bar. */
export function DayBarLegend({ items, labels, className }: { items: LegendKey[]; labels: Record<LegendKey, string>; className?: string }) {
  const { t } = useApp();
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] font-medium text-muted-foreground', className)} aria-label={t('a11y_colour_key')}>
      {items.map(k => (
        <li key={k} className="flex items-center gap-1.5">
          <span className="flex w-4 justify-center">{SWATCH[k]}</span>
          {labels[k]}
        </li>
      ))}
    </ul>
  );
}

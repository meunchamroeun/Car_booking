'use client';

import * as React from 'react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import type { Language } from '@/types';

const FROM = 7 * 60; // track starts 07:00
const TO = 22 * 60; // and ends 22:00
const SPAN = TO - FROM;
const STEP = 15; // minutes per snap
const MIN_LEN = 30;
const LABEL_HOURS = [9, 12, 15, 18, 21];

const toTime = (m: number) => `${DateUtil.pad(Math.floor(m / 60))}:${DateUtil.pad(m % 60)}`;
const pct = (m: number) => ((Math.min(TO, Math.max(FROM, m)) - FROM) / SPAN) * 100;
const hourLabel = (h: number, lang: Language) => `${h % 12 || 12} ${lang === 'kh' ? (h < 12 ? 'ព្រឹក' : 'ល្ងាច') : h < 12 ? 'AM' : 'PM'}`;

type Block = { id: string; start: string; end: string };
type Kind = 'start' | 'end' | 'move';

const HATCH = 'bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.2)_0_1px,transparent_1px_6px)]';

/**
 * Day track to pick a time range: drag either handle to change start or end, drag the
 * yellow block to move it, or tap the track to move it there. Snaps to 15 minutes.
 */
export function TimeRangeTrack({
  start,
  end,
  onChange,
  booked,
  pending,
  now,
  invalid,
  lang,
  labels,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  /** Approved bookings: the car is taken. */
  booked: Block[];
  /** Requests still waiting for approval. */
  pending: Block[];
  /** Minutes since midnight when the day is today; earlier time can't be picked. */
  now?: number;
  invalid?: boolean;
  lang: Language;
  labels: { yours: string; booked: string; pending: string; start: string; end: string };
}) {
  const track = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ kind: Kind; offset: number } | null>(null);
  const [dragging, setDragging] = React.useState<Kind | null>(null);
  const s = DateUtil.toMins(start);
  const e = DateUtil.toMins(end);
  const minStart = now != null ? Math.max(FROM, Math.ceil(now / STEP) * STEP) : FROM;

  const minsAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.round((FROM + ((clientX - r.left) / r.width) * SPAN) / STEP) * STEP;
  };

  const apply = (kind: Kind, m: number, offset = 0) => {
    let ns = s;
    let ne = e;
    if (kind === 'start') ns = Math.min(Math.max(m, minStart), e - MIN_LEN);
    else if (kind === 'end') ne = Math.min(Math.max(m, Math.max(s, minStart) + MIN_LEN), TO);
    else {
      const len = Math.min(e - s, TO - minStart);
      ns = Math.min(Math.max(m - offset, minStart), TO - len);
      ne = ns + len;
    }
    if (ns !== s || ne !== e) onChange(toTime(ns), toTime(ne));
  };

  const onPointerDown = (ev: React.PointerEvent) => {
    const kind = ((ev.target as HTMLElement).closest('[data-kind]')?.getAttribute('data-kind') as Kind | null) ?? null;
    const m = minsAt(ev.clientX);
    // Tapping empty track moves the whole range so it starts there
    drag.current = kind ? { kind, offset: kind === 'move' ? m - s : 0 } : { kind: 'move', offset: 0 };
    if (!kind) apply('move', m);
    setDragging(drag.current.kind);
    track.current!.setPointerCapture(ev.pointerId);
  };
  const onPointerMove = (ev: React.PointerEvent) => drag.current && apply(drag.current.kind, minsAt(ev.clientX), drag.current.offset);
  const stop = () => ((drag.current = null), setDragging(null));

  const keys = (kind: 'start' | 'end') => (ev: React.KeyboardEvent) => {
    const d = ev.key === 'ArrowLeft' || ev.key === 'ArrowDown' ? -STEP : ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? STEP : 0;
    if (!d) return;
    ev.preventDefault();
    apply(kind, (kind === 'start' ? s : e) + d);
  };

  const handle = (kind: 'start' | 'end', at: number) => (
    <span
      data-kind={kind}
      role="slider"
      tabIndex={0}
      aria-label={kind === 'start' ? labels.start : labels.end}
      aria-valuemin={FROM}
      aria-valuemax={TO}
      aria-valuenow={at}
      aria-valuetext={toTime(at)}
      onKeyDown={keys(kind)}
      className="absolute inset-y-0 z-20 flex w-7 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      style={{ left: `${pct(at)}%` }}
    >
      <span
        className={cn(
          'h-6 w-2.5 rounded-full border-[1.5px] border-foreground/80 shadow-sm transition-transform',
          invalid ? 'bg-destructive' : 'bg-[#F6CB4C]',
          dragging === kind && 'scale-110'
        )}
      />
    </span>
  );

  return (
    <div className="select-none">
      {/* Hour labels */}
      <div className="relative mb-1 h-3.5 text-[10.5px] font-medium text-muted-foreground">
        {LABEL_HOURS.map(h => (
          <span key={h} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${pct(h * 60)}%` }}>
            {hourLabel(h, lang)}
          </span>
        ))}
      </div>

      <div
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        className="relative h-11 touch-none select-none overflow-visible rounded-lg border bg-card"
      >
        {/* Hour lines */}
        <div className="pointer-events-none absolute inset-0 flex overflow-hidden rounded-lg">
          {Array.from({ length: SPAN / 60 }, (_, i) => (
            <span key={i} className={cn('flex-1', i > 0 && 'border-l border-border/50')} />
          ))}
        </div>

        {/* Time already passed today */}
        {now != null && now > FROM && (
          <div className={cn('pointer-events-none absolute inset-y-0 left-0 rounded-l-lg', HATCH)} style={{ width: `${pct(now)}%` }} aria-hidden />
        )}

        {pending.map(b => (
          <div
            key={b.id}
            className={cn('pointer-events-none absolute inset-y-1.5 rounded border border-muted-foreground/40 bg-card', HATCH)}
            style={{ left: `${pct(DateUtil.toMins(b.start))}%`, width: `${pct(DateUtil.toMins(b.end)) - pct(DateUtil.toMins(b.start))}%` }}
            aria-hidden
          />
        ))}
        {booked.map(b => (
          <div
            key={b.id}
            className="pointer-events-none absolute inset-y-1.5 rounded bg-foreground/80"
            style={{ left: `${pct(DateUtil.toMins(b.start))}%`, width: `${pct(DateUtil.toMins(b.end)) - pct(DateUtil.toMins(b.start))}%` }}
            aria-hidden
          />
        ))}

        {/* Chosen range */}
        <div
          data-kind="move"
          className={cn(
            'absolute inset-y-0 z-10 cursor-grab border-x-[1.5px] active:cursor-grabbing',
            invalid ? 'border-destructive bg-destructive/15' : 'border-[#E2B93B] bg-[#FCE9A6]/70'
          )}
          style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%` }}
        />
        {handle('start', s)}
        {handle('end', e)}

        {now != null && now > FROM && now < TO && <div className="pointer-events-none absolute -inset-y-0.5 z-20 w-px bg-foreground" style={{ left: `${pct(now)}%` }} aria-hidden />}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-3.5 rounded-sm border border-[#E2B93B] bg-[#FCE9A6]" /> {labels.yours}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-3.5 rounded-sm bg-foreground/80" /> {labels.booked}
        </span>
        <span className="flex items-center gap-1">
          <span className={cn('h-2.5 w-3.5 rounded-sm border border-muted-foreground/40', HATCH)} /> {labels.pending}
        </span>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';

const pad = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = ['00', '15', '30', '45'];
// Pixel sizes (not rem) so scroll maths match exactly regardless of root font size
export const ITEM_H = 40;
const WHEEL_H = 200;

/** Turn what the user typed into "HH:MM": "930" → "09:30", "9" → "09:00", "17.5" → "17:05". */
export function parseTime(raw: string): string | null {
  const t = raw.trim();
  let h: number;
  let m: number;
  const sep = t.match(/^(\d{1,2})\s*[:.hH]\s*(\d{1,2})?$/);
  if (sep) {
    h = Number(sep[1]);
    m = Number(sep[2] ?? 0);
  } else if (/^\d{1,4}$/.test(t)) {
    if (t.length <= 2) {
      h = Number(t);
      m = 0;
    } else {
      h = Number(t.slice(0, t.length - 2));
      m = Number(t.slice(-2));
    }
  } else return null;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Time input for mobile: type it directly ("0930", "9:30"), or tap the clock to open
 * an iOS-style scroll wheel with hours and 15-minute steps.
 */
export function TimeField({
  label,
  value,
  onChange,
  open,
  onOpenChange,
  invalid,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invalid?: boolean;
  required?: boolean;
}) {
  const { t } = useApp();
  const [text, setText] = React.useState(value);
  const [bad, setBad] = React.useState(false);
  const id = React.useId();
  React.useEffect(() => setText(value), [value]);

  const commit = () => {
    const v = parseTime(text);
    if (v) {
      setBad(false);
      setText(v);
      if (v !== value) onChange(v);
    } else {
      setBad(true);
      setText(value);
      setTimeout(() => setBad(false), 1600);
    }
  };

  const [h, m] = value.split(':');

  // `contents` lets the wheel span the full width of the parent grid row
  return (
    <div className="contents">
      <div
        className={cn(
          'relative flex h-[56px] items-center rounded-xl border bg-card pl-3.5 pr-1 transition-[border-color,box-shadow]',
          open ? 'border-primary ring-[3px] ring-primary/15' : 'border-input focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15',
          (bad || invalid) && 'border-destructive'
        )}
      >
        <label htmlFor={id} className="pointer-events-none absolute left-3.5 top-1.5 text-[11px] font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        <input
          id={id}
          value={text}
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          onChange={e => setText(e.target.value.replace(/[^\d:.hH]/g, ''))}
          onFocus={e => e.target.select()}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), (e.target as HTMLInputElement).blur())}
          aria-invalid={bad || invalid}
          aria-required={required || undefined}
          className="h-full min-w-0 flex-1 bg-transparent pt-4 text-[18px] font-bold tabular outline-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label={t('a11y_pick_time', { label })}
          aria-expanded={open}
          className={cn('flex size-10 items-center justify-center rounded-lg transition-colors', open ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
        >
          <Clock className="size-[18px]" />
        </button>
      </div>
      {bad && <p className="col-span-full -mt-1 text-right text-[11.5px] font-medium text-destructive">{t('time_example')}</p>}
      {open && (
        <div className="relative col-span-full flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card animate-in fade-in-0 zoom-in-95">
          <div className="relative flex px-6">
            {/* Selection band */}
            <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary-soft" style={{ height: ITEM_H }} />
            <Wheel items={HOURS} value={h} onChange={nh => onChange(`${nh}:${m}`)} ariaLabel={t('a11y_hour', { label })} loop />
            <div className="relative z-10 flex items-center text-[20px] font-bold text-muted-foreground">:</div>
            <Wheel
              items={MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort()}
              value={m}
              onChange={nm => onChange(`${h}:${nm}`)}
              ariaLabel={t('a11y_minute', { label })}
              loop
            />
            {/* Fade top/bottom like native wheels */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-card to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Quick bar with value & done button */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">
              {label}: <span className="font-bold text-foreground tabular">{value}</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-2.5 py-1 text-[12px] font-semibold text-primary hover:bg-primary-soft"
            >
              {t('confirm') ?? 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** One scroll-snapping column. Scroll, tap a row, or use arrow keys. */
export function Wheel({
  items,
  value,
  onChange,
  ariaLabel,
  loop = false,
  itemH = ITEM_H,
  wheelH = WHEEL_H,
  textClass = 'text-[20px]',
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  loop?: boolean;
  /** Row / column height in px (smaller for compact dropdowns). */
  itemH?: number;
  wheelH?: number;
  textClass?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isUserScrolling = React.useRef(false);

  const N = items.length;
  const REPEATS = loop ? (N <= 4 ? 9 : 5) : 1;
  const midRepeat = Math.floor(REPEATS / 2);
  const repeatOffset = midRepeat * N;

  const baseIdx = Math.max(0, items.indexOf(value));
  const activeIdx = loop ? repeatOffset + baseIdx : baseIdx;

  // Repeated list for smooth seamless looping
  const displayItems = React.useMemo(() => {
    if (!loop) return items.map((it, i) => ({ key: `${it}-${i}`, it, origIdx: i }));
    const list: { key: string; it: string; origIdx: number }[] = [];
    for (let r = 0; r < REPEATS; r++) {
      for (let i = 0; i < N; i++) {
        list.push({ key: `${r}-${items[i]}-${i}`, it: items[i], origIdx: i });
      }
    }
    return list;
  }, [items, loop, N, REPEATS]);

  // Center on current value
  React.useEffect(() => {
    const el = ref.current;
    if (!el || isUserScrolling.current) return;
    const target = activeIdx * itemH;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: el.dataset.ready ? 'smooth' : 'auto' });
    }
    el.dataset.ready = '1';
  }, [activeIdx]);

  const onScroll = () => {
    isUserScrolling.current = true;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      isUserScrolling.current = false;
      const el = ref.current;
      if (!el) return;
      const rawIdx = Math.round(el.scrollTop / itemH);
      const normalizedIdx = loop ? ((rawIdx % N) + N) % N : Math.min(N - 1, Math.max(0, rawIdx));
      if (items[normalizedIdx] !== value) {
        onChange(items[normalizedIdx]);
      }
      // Re-center scrollTop silently if scrolled near edges
      if (loop && (rawIdx < N || rawIdx >= (REPEATS - 1) * N)) {
        const resetTarget = (repeatOffset + normalizedIdx) * itemH;
        el.scrollTo({ top: resetTarget, behavior: 'instant' as ScrollBehavior });
      }
    }, 90);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={e => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const nextIdx = loop ? ((baseIdx + delta) % N + N) % N : Math.min(N - 1, Math.max(0, baseIdx + delta));
        onChange(items[nextIdx]);
      }}
      className="no-scrollbar relative z-10 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none"
      style={{ height: wheelH, paddingBlock: (wheelH - itemH) / 2 }}
    >
      {displayItems.map(({ key, it }) => (
        <div
          key={key}
          role="option"
          aria-selected={it === value}
          onClick={() => onChange(it)}
          style={{ height: itemH }}
          className={cn(
            'flex cursor-pointer snap-center items-center justify-center tabular transition-all',
            textClass,
            it === value ? 'font-bold text-primary' : 'font-medium text-muted-foreground/60'
          )}
        >
          {it}
        </div>
      ))}
    </div>
  );
}

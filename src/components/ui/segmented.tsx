'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
}

/** Pill segmented control (single-select), keyboard accessible via arrow keys. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'default',
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  ariaLabel?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex gap-1 bg-muted p-1', size === 'lg' ? 'rounded-[20px]' : 'rounded-full', className)}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={el => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={e => onKey(e, i)}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-all [&_svg]:size-4',
              size === 'sm' ? 'h-8 px-2.5 text-[12.5px]' : size === 'lg' ? 'h-[52px] rounded-2xl px-2 text-[13px]' : 'h-9 px-3 text-[13px]',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {o.icon}
            {o.label}
            {!!o.count && (
              <span className={cn('min-w-[18px] rounded-full px-1.5 text-[10.5px] leading-[18px]', active ? 'bg-primary text-primary-foreground' : 'bg-foreground/10')}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Horizontally scrolling filter chips. */
export function Chips<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: SegmentOption<T>[]; className?: string }) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4', className)}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors [&_svg]:size-4',
              active ? 'border-navy bg-navy text-navy-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground' : 'bg-card text-foreground/80 hover:bg-muted'
            )}
          >
            {o.icon}
            {o.label}
            {!!o.count && <span className="text-[11px] opacity-70">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

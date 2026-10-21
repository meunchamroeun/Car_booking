'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Wheel } from '@/components/ui/time-field';

const pad = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => pad(i)); // 00 … 23
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5)); // 00, 05 … 55
const ROW = 30; // compact wheel row height (px)
const COLUMN = 150; // compact wheel height (px)

/**
 * Small 24-hour time dropdown anchored under `children` (the time you tapped):
 * the time in a pill you can type into (e.g. "2000" → 20:00), and hour : minute wheels.
 * Tap outside or press Esc to close.
 */
export function TimeWheelPicker({
  open,
  onOpenChange,
  value,
  onChange,
  title,
  labels,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "HH:MM", 24-hour. */
  value: string;
  onChange: (time: string) => void;
  title: string;
  labels: { hour: string; minute: string };
  /** The element the dropdown opens under. */
  children: React.ReactNode;
}) {
  const [h, m] = value.split(':');
  const [text, setText] = React.useState(value);
  const [typing, setTyping] = React.useState(false);
  React.useEffect(() => {
    if (!typing) setText(value);
  }, [value, typing]);

  const type = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setText(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);
    if (digits.length !== 4) return;
    if (Number(digits.slice(0, 2)) < 24 && Number(digits.slice(2)) < 60) onChange(`${digits.slice(0, 2)}:${digits.slice(2)}`);
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>{children}</Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          aria-label={title}
          // Don't focus the text box on open (it would pop up the phone keyboard)
          onOpenAutoFocus={e => e.preventDefault()}
          className="z-[70] w-[156px] overflow-hidden rounded-xl border bg-card shadow-float outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center justify-between gap-2 border-b px-2.5 py-1.5">
            <span className="truncate text-[11.5px] font-medium text-muted-foreground">{title}</span>
            <input
              value={text}
              onFocus={e => (setTyping(true), requestAnimationFrame(() => e.target.select()))}
              onChange={e => type(e.target.value)}
              onBlur={() => setTyping(false)}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              inputMode="numeric"
              aria-label={title}
              className="w-[58px] rounded-full bg-muted px-2 py-0.5 text-center text-[13px] font-semibold tabular text-primary outline-none focus:bg-primary-soft focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="relative flex px-3">
            {/* Selection band */}
            <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 rounded-lg bg-muted" style={{ height: ROW }} />
            <Wheel items={HOURS} value={h} onChange={nh => onChange(`${nh}:${m}`)} ariaLabel={labels.hour} loop itemH={ROW} wheelH={COLUMN} textClass="text-[15px]" />
            <div className="relative z-10 flex items-center text-[15px] font-bold text-muted-foreground">:</div>
            <Wheel
              items={MINUTES.includes(m) ? MINUTES : [...MINUTES, m].sort()}
              value={m}
              onChange={nm => onChange(`${h}:${nm}`)}
              ariaLabel={labels.minute}
              loop
              itemH={ROW}
              wheelH={COLUMN}
              textClass="text-[15px]"
            />
            {/* Fade top / bottom like native wheels */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-card to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

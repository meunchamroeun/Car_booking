'use client';

import * as React from 'react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

const STEP = 15; // minutes per scroll notch / drag step
const DRAG_PX = 14; // finger movement per step
const toTime = (m: number) => `${DateUtil.pad(Math.floor(m / 60))}:${DateUtil.pad(m % 60)}`;

/**
 * A time you can change in place:
 *  - scroll the mouse wheel or drag up / down with a finger (15 minutes per step),
 *  - press ↑ / ↓,
 *  - or tap to open the wheel picker (`onOpen`), where it can also be typed.
 */
export function TimeSpin({
  value,
  onChange,
  onOpen,
  min = 0,
  max = 23 * 60 + 45,
  label,
  active,
  className,
}: {
  value: string;
  onChange: (time: string) => void;
  onOpen: () => void;
  /** Earliest / latest allowed, in minutes since midnight. */
  min?: number;
  max?: number;
  label: string;
  active?: boolean;
  className?: string;
}) {
  const [dragging, setDragging] = React.useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);
  const drag = React.useRef<{ y: number; base: number; moved: boolean } | null>(null);

  const mins = DateUtil.toMins(value);
  const set = (m: number) => {
    const c = Math.min(max, Math.max(min, Math.round(m / STEP) * STEP));
    if (c !== mins) onChange(toTime(c));
  };

  // Wheel needs a non-passive listener so the sheet doesn't scroll at the same time
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      set(mins + (e.deltaY < 0 ? STEP : -STEP));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      onKeyDown={e => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          set(mins + (e.key === 'ArrowUp' ? STEP : -STEP));
        }
      }}
      // Drag up / down changes the time; a plain tap opens the picker
      onPointerDown={e => {
        drag.current = { y: e.clientY, base: mins, moved: false };
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (!d) return;
        const steps = Math.trunc((d.y - e.clientY) / DRAG_PX);
        if (!d.moved && steps !== 0) {
          d.moved = true;
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* pointer already released */
          }
        }
        if (d.moved) set(d.base + steps * STEP);
      }}
      onPointerUp={() => {
        const moved = drag.current?.moved;
        drag.current = null;
        setDragging(false);
        if (!moved) onOpen();
      }}
      onPointerCancel={() => ((drag.current = null), setDragging(false))}
      onClick={e => e.detail === 0 && onOpen()} // keyboard Enter / Space
      className={cn(
        'cursor-ns-resize touch-none rounded-md px-1 tabular outline-none transition-colors',
        'hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-primary/30',
        (dragging || active) && 'bg-primary-soft text-primary',
        className
      )}
    >
      {value}
    </button>
  );
}

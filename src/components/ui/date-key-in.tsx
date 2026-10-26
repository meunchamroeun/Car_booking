'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

/** Date box: type dd/mm/yyyy (slashes are added while typing) or tap the icon to pick from the calendar. */
export function DateKeyIn({
  value,
  min,
  active,
  open,
  onChange,
  onToggle,
  onOpen,
  label,
  placeholder,
  pickLabel,
}: {
  value: string;
  min: string;
  active: boolean;
  open: boolean;
  onChange: (date: string) => void;
  onToggle: () => void;
  /** Tapping the box (not the icon) also opens the calendar — leave out when the calendar is a popup, so typing works. */
  onOpen?: () => void;
  label: string;
  placeholder: string;
  pickLabel: string;
}) {
  const shown = (d: string) => (d && d.length >= 10 ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');
  // Always shows the chosen day (today by default), so it can be edited in place
  const [text, setText] = React.useState(shown(value));
  const [bad, setBad] = React.useState(false);
  React.useEffect(() => {
    setText(shown(value));
    setBad(false);
  }, [value]);

  // A full date that exists and is not in the past, or null
  const parse = (digits: string) => {
    if (digits.length !== 8) return null;
    const iso = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
    const d = new Date(`${iso}T00:00`);
    return !isNaN(d.getTime()) && DateUtil.toDateStr(d) === iso && iso >= min ? iso : null;
  };
  const type = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setText(digits.length > 4 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
    const iso = parse(digits);
    setBad(digits.length === 8 && !iso);
    if (iso) onChange(iso);
  };
  const leave = () => {
    if (!parse(text.replace(/\D/g, ''))) setText(shown(value));
    setBad(false);
  };

  return (
    // Looks and acts like the Today / Tomorrow buttons: tap anywhere to open the calendar, or type a date
    <div
      onClick={e => onOpen && !(e.target as HTMLElement).closest('button') && !open && onOpen()}
      className={cn(
        'flex h-8 min-w-0 cursor-pointer items-center gap-0.5 rounded-[10px] pl-0.5 pr-1.5 transition-all',
        bad ? 'bg-background ring-1 ring-destructive' : active ? 'bg-primary shadow-sm' : open ? 'bg-background shadow-xs ring-1 ring-primary/30' : 'hover:bg-background/70'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={pickLabel}
        aria-expanded={open}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
          active && !bad ? 'text-primary-foreground' : open ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <CalendarDays className="size-4" />
      </button>
      <input
        value={text}
        onChange={e => type(e.target.value)}
        onBlur={leave}
        onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
        inputMode="numeric"
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={bad}
        className={cn(
          'min-w-0 flex-1 cursor-pointer bg-transparent text-[12.5px] tabular outline-none placeholder:text-muted-foreground focus:cursor-text focus-visible:ring-0 focus-visible:ring-offset-0',
          active && !bad ? 'font-semibold text-primary-foreground placeholder:text-primary-foreground/70' : 'text-muted-foreground focus:text-foreground'
        )}
      />
    </div>
  );
}

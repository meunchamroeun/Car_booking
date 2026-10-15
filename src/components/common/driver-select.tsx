'use client';

import * as React from 'react';
import { ChevronDown, Phone, UserRound } from 'lucide-react';
import { useApp } from '@/lib/store';
import { isDriverBusy } from '@/lib/fleet-service';
import { Booking } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/** Availability of each driver for this booking's window. */
export function useDriverOptions(b: Booking) {
  const app = useApp();
  const { drivers, t } = app;
  return drivers.map(d => {
    if (d.status !== 'Active') return { driver: d, ok: false, label: t('driver_off') };
    const busy = isDriverBusy(app, d.id, b);
    return busy
      ? { driver: d, ok: false, label: t('driver_busy', { start: busy.startTime, end: busy.endTime }) }
      : { driver: d, ok: true, label: t('driver_free') };
  });
}

/**
 * Dropdown of company drivers (native picker on phones). Busy / off-duty drivers are
 * listed but disabled, with the reason. Shows the chosen driver's avatar and phone.
 */
export function DriverSelect({ b, value, onChange }: { b: Booking; value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useApp();
  const options = useDriverOptions(b);
  const selected = options.find(o => o.driver.id === value);
  const id = React.useId();
  const freeCount = options.filter(o => o.ok).length;

  return (
    <div onClick={e => e.stopPropagation()}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[12.5px] font-semibold text-foreground/85">
          {t('driver')} <span className="text-destructive">*</span>
        </label>
        <span className="text-[11.5px] text-muted-foreground">{t('drivers_free_n', { n: freeCount })}</span>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
          {selected ? (
            <Avatar initials={selected.driver.name.split(' ').map(x => x[0]).join('')} seed={selected.driver.id} className="size-8 text-[11px]" />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserRound className="size-4" />
            </span>
          )}
        </span>
        <select
          id={id}
          value={value ?? ''}
          onChange={e => onChange(e.target.value || null)}
          className={cn(
            'h-12 w-full appearance-none rounded-xl border bg-card pl-12 pr-10 text-[14.5px] font-semibold transition-[border-color,box-shadow] focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15',
            selected ? 'border-primary/50 text-foreground' : 'border-input text-muted-foreground'
          )}
        >
          <option value="">{t('driver_placeholder')}</option>
          {options.map(o => (
            <option key={o.driver.id} value={o.driver.id} disabled={!o.ok}>
              {o.driver.name} — {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {selected && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" /> {t('driver_free')} · <Phone className="size-3" /> {selected.driver.phone}
        </p>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Phone, Search, UserRound, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { isDriverBusy } from '@/lib/fleet-service';
import { Booking } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/** Availability of each driver for this booking's window — free drivers first. */
export function useDriverOptions(b: Booking) {
  const app = useApp();
  const { drivers, t } = app;
  return drivers
    .map(d => {
      if (d.status !== 'Active') return { driver: d, ok: false, label: t('driver_off') };
      const busy = isDriverBusy(app, d.id, b);
      return busy
        ? { driver: d, ok: false, label: t('driver_busy', { start: busy.startTime, end: busy.endTime }) }
        : { driver: d, ok: true, label: t('driver_free') };
    })
    .sort((x, y) => Number(y.ok) - Number(x.ok));
}

const initials = (name: string) =>
  name
    .split(' ')
    .map(x => x[0])
    .join('');

/**
 * App-styled driver dropdown (Radix menu: keyboard, focus and outside-click handled).
 * Busy / off-duty drivers are shown but disabled with the reason.
 */
export function DriverSelect({ b, value, onChange }: { b: Booking; value: string | null; onChange: (id: string | null) => void }) {
  const { t } = useApp();
  const options = useDriverOptions(b);
  const selected = options.find(o => o.driver.id === value);
  const freeCount = options.filter(o => o.ok).length;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Fresh search each time; put the cursor in the box once the menu has opened
  React.useEffect(() => {
    if (!open) return setQuery('');
    const id = setTimeout(() => searchRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  const q = query.trim().toLowerCase();
  const digits = q.replace(/\D/g, '');
  const shown = options.filter(
    o => !q || o.driver.name.toLowerCase().includes(q) || (!!digits && o.driver.phone.replace(/\D/g, '').includes(digits))
  );

  return (
    // Taps here must not reach the card underneath (which opens the review)
    <div onClick={e => e.stopPropagation()}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12.5px] font-semibold text-foreground/85">
          {t('driver')} <span className="text-destructive">*</span>
        </span>
        <span className="text-[11.5px] text-muted-foreground">{t('drivers_free_n', { n: freeCount })}</span>
      </div>

      <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
        <Menu.Trigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-12 w-full items-center gap-2.5 rounded-xl border bg-card pl-2 pr-3 text-left transition-[border-color,box-shadow] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15',
              open ? 'border-primary ring-[3px] ring-primary/15' : selected ? 'border-primary/50' : 'border-input hover:border-primary/40'
            )}
          >
            {selected ? (
              <Avatar initials={initials(selected.driver.name)} seed={selected.driver.id} src={selected.driver.avatarUrl} className="size-8 text-[11px]" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="size-4" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              {selected ? (
                <>
                  <span className="block truncate text-[14px] font-semibold">{selected.driver.name}</span>
                  <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                    <Phone className="size-3" /> {selected.driver.phone}
                  </span>
                </>
              ) : (
                <span className="block truncate text-[14px] font-medium text-muted-foreground">{t('driver_placeholder')}</span>
              )}
            </span>
            <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </button>
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Content
            align="start"
            sideOffset={6}
            collisionPadding={12}
            onClick={e => e.stopPropagation()}
            className="z-[70] w-[var(--radix-dropdown-menu-trigger-width)] overflow-hidden rounded-2xl border bg-card p-1.5 shadow-float outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1"
          >
            {/* Search: keys typed here must not trigger the menu's own type-to-select */}
            <div className="relative mb-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    (e.currentTarget.closest('[role=menu]')?.querySelector('[role=menuitem]:not([data-disabled])') as HTMLElement | null)?.focus();
                    return;
                  }
                  e.stopPropagation();
                }}
                placeholder={t('driver_search')}
                aria-label={t('driver_search')}
                className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-[13.5px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 focus-visible:ring-offset-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => (setQuery(''), searchRef.current?.focus())}
                  aria-label={t('close')}
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Menu.Label className="px-2.5 pb-1 pt-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{t('choose_driver')}</Menu.Label>
            {shown.length === 0 && <p className="px-2.5 py-3 text-center text-[13px] text-muted-foreground">{t('driver_no_match')}</p>}
            {shown.map(o => {
              const active = o.driver.id === value;
              return (
                <Menu.Item
                  key={o.driver.id}
                  disabled={!o.ok}
                  onSelect={() => onChange(o.driver.id)}
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2 py-2 outline-none transition-colors',
                    'data-[highlighted]:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                    active && 'bg-primary-soft data-[highlighted]:bg-primary-soft'
                  )}
                >
                  <Avatar initials={initials(o.driver.name)} seed={o.driver.id} src={o.driver.avatarUrl} className="size-8 text-[11px]" />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[13.5px] font-semibold', active && 'text-primary')}>{o.driver.name}</span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">{o.driver.phone}</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      o.ok ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {o.label}
                  </span>
                  <span className="flex w-4 shrink-0 justify-center">{active && <Check className="size-4 text-primary" strokeWidth={3} />}</span>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

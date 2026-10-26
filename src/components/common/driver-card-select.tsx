'use client';

import * as React from 'react';
import { Check, Phone, UserX } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Booking } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { useDriverOptions } from '@/components/common/driver-select';
import { cn } from '@/lib/utils';

const initials = (name: string) =>
  name
    .split(' ')
    .map(x => x[0])
    .join('');

export function DriverCardSelect({
  b,
  driverId,
  assign,
  onSelectDriver,
  onSelectNoDriver,
}: {
  b: Booking;
  driverId: string | null;
  assign: 'yes' | 'no' | null;
  onSelectDriver: (id: string) => void;
  onSelectNoDriver: () => void;
}) {
  const { t } = useApp();
  const options = useDriverOptions(b);
  const freeCount = options.filter(o => o.ok).length;

  return (
    <div className="space-y-2" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-foreground">
          {t('assign_q')} <span className="text-destructive">*</span>
        </p>
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {t('drivers_free_n', { n: freeCount })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label={t('choose_driver')}>
        {options.map(o => {
          const isSelected = assign === 'yes' && driverId === o.driver.id;
          return (
            <button
              key={o.driver.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!o.ok}
              onClick={() => onSelectDriver(o.driver.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary-soft/70 ring-1 ring-primary shadow-xs'
                  : o.ok
                    ? 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40 active:scale-[0.99]'
                    : 'border-border/40 bg-muted/20 opacity-55 cursor-not-allowed'
              )}
            >
              <Avatar initials={initials(o.driver.name)} seed={o.driver.id} src={o.driver.avatarUrl} className="size-9 shrink-0 text-[11px]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn('truncate text-[13.5px] font-semibold leading-tight', isSelected ? 'text-primary' : 'text-foreground')}>
                    {o.driver.name}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold leading-none',
                      o.ok ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {o.label}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground leading-none">
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    <span>{o.driver.phone}</span>
                  </span>
                  {o.driver.licenseNo && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span className="font-mono text-[11px]">{o.driver.licenseNo}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="shrink-0">
                <div
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-muted-foreground/30 bg-background'
                  )}
                >
                  {isSelected && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>
            </button>
          );
        })}

        {/* Don't have driver option card */}
        <button
          type="button"
          role="radio"
          aria-checked={assign === 'no'}
          onClick={onSelectNoDriver}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all',
            assign === 'no'
              ? 'border-primary bg-primary-soft/70 ring-1 ring-primary shadow-xs'
              : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40 active:scale-[0.99]'
          )}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
              assign === 'no' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            <UserX className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <span className={cn('block truncate text-[13.5px] font-semibold leading-tight', assign === 'no' ? 'text-primary' : 'text-foreground')}>
              {t('dont_have_driver')}
            </span>
            <span className="mt-1 block text-[11.5px] text-muted-foreground leading-tight">
              {t('dont_have_driver_desc')}
            </span>
          </div>
          <div className="shrink-0">
            <div
              className={cn(
                'flex size-5 items-center justify-center rounded-full border transition-all',
                assign === 'no'
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-muted-foreground/30 bg-background'
              )}
            >
              {assign === 'no' && <Check className="size-3 stroke-[3]" />}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { CarFront, ChevronRight, Clock, Route, Users, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { fleetStats } from '@/lib/selectors';
import { can } from '@/lib/permissions';
import { KpiKind } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState } from '@/components/ui/empty';
import { TripCard } from '@/components/common/trip-card';
import { CarPhoto } from '@/components/common/car-photo';

const ICON: Record<KpiKind, typeof CarFront> = { available: CarFront, in_use: Route, today: Clock, service: Wrench };

/** Full-screen list behind each "Fleet today" number. */
export function KpiSheet({ open, kind }: { open: boolean; kind?: KpiKind }) {
  const app = useApp();
  const { t, lang, currentUser, closeSheet, openSheet, openBooking } = app;
  if (!kind) return null;
  const s = fleetStats(app);
  const canBook = can(currentUser, 'booking.create');
  const canService = can(currentUser, 'vehicle.maintenance');

  const title = { available: t('kpi_available'), in_use: t('kpi_in_use'), today: t('kpi_trips_today'), service: t('kpi_service') }[kind];
  const count = { available: s.available.length, in_use: s.inUse.length, today: s.tripsToday.length, service: s.inService.length }[kind];
  const Icon = ICON[kind];

  return (
    <Sheet fullScreen open={open} onOpenChange={o => !o && closeSheet()} title={title} description={`${DateUtil.friendly(DateUtil.todayStr(), lang)} · ${count}`}>
      {count === 0 && <EmptyState icon={<Icon />} title={t('no_results')} className="mt-2" />}

      {(kind === 'available' || kind === 'service') && count > 0 && (
        <ul className="overflow-hidden rounded-2xl border bg-card">
          {(kind === 'available' ? s.available : s.inService).map((c, i) => {
            const action = kind === 'available' ? (canBook ? () => openBooking(c.id, undefined, undefined, DateUtil.todayStr()) : undefined) : canService ? () => openSheet({ type: 'maintenance', carId: c.id }) : undefined;
            const m = c.maintenance;
            return (
              <li key={c.id} className={i > 0 ? 'border-t' : undefined}>
                <button type="button" disabled={!action} onClick={action} className="flex w-full items-center gap-3 p-3.5 text-left transition-colors enabled:hover:bg-muted/50">
                  <CarPhoto car={c} className="h-12 w-[72px] shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{c.name}</span>
                    <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <span className="font-mono">{c.plate}</span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" /> {t('seats', { n: c.seats })}
                      </span>
                    </span>
                    {kind === 'service' && m && (
                      <span className="mt-0.5 block truncate text-[12px] font-medium text-warning">
                        {m.reason}
                        {m.estimatedDate ? ` · ${t('back_on', { date: DateUtil.friendly(m.estimatedDate, lang) })}` : ''}
                      </span>
                    )}
                  </span>
                  {action && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[12.5px] font-semibold text-primary">
                      {kind === 'available' ? t('book_short') : t('manage')} <ChevronRight className="size-4" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(kind === 'in_use' || kind === 'today') && count > 0 && (
        <div className="space-y-3">
          {(kind === 'in_use' ? s.inUse : [...s.tripsToday].sort((a, b) => a.startTime.localeCompare(b.startTime))).map(b => (
            <TripCard key={b.id} b={b} perspective="reviewer" />
          ))}
        </div>
      )}
    </Sheet>
  );
}

'use client';

import * as React from 'react';
import { Booking } from '@/types';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { BookingStatusBadge } from '@/components/common/status';
import { CarPhoto } from '@/components/common/car-photo';
import { Clock, MapPin, UserRound, Users } from 'lucide-react';

/**
 * One trip in a list. `perspective` decides who is the main subject:
 *  - requester view shows the vehicle
 *  - reviewer/driver view shows the person requesting
 */
export function TripCard({
  b,
  perspective = 'requester',
  footer,
  beforeFooter,
  onClick,
}: {
  b: Booking;
  perspective?: 'requester' | 'reviewer' | 'driver';
  footer?: React.ReactNode;
  /** Extra block between the card body and the footer (e.g. a choice to make before acting). */
  beforeFooter?: React.ReactNode;
  onClick?: () => void;
}) {
  const { cars, users, drivers, t, lang, openSheet } = useApp();
  const car = cars.find(c => c.id === b.carId);
  const requester = users.find(u => u.id === b.requesterId);
  const driver = drivers.find(d => d.id === b.driverId);
  const open = onClick ?? (() => openSheet({ type: 'booking', id: b.id }));

  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={open} className="block w-full p-4 text-left transition-colors hover:bg-muted/40">
        <div className="flex items-start gap-3">
          {perspective === 'requester' ? (
            <CarPhoto car={car} className="h-11 w-16 shrink-0 rounded-xl" />
          ) : (
            <Avatar initials={requester?.initials ?? '?'} seed={requester?.id} className="size-11" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold leading-snug">{perspective === 'requester' ? car?.name : requester?.name}</p>
                <p className="truncate text-[12.5px] text-muted-foreground">
                  {perspective === 'requester' ? (
                    <span className="font-mono">{car?.plate}</span>
                  ) : (
                    <>
                      {requester?.dept} · {car?.name}
                    </>
                  )}
                </p>
              </div>
              <BookingStatusBadge b={b} />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
          <span className="col-span-2 flex items-center gap-1.5 font-semibold">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="truncate tabular">
              {DateUtil.window(b, lang)}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{b.destination || '—'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-3.5" />
            {t('pax', { n: b.passengers })}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <UserRound className="size-3.5" />
            <span className="truncate">{b.needDriver ? driver?.name ?? t('with_driver') : t('self_drive')}</span>
          </span>
        </div>

        {perspective !== 'driver' && b.purpose && <p className="mt-2.5 line-clamp-2 rounded-lg bg-muted/60 px-3 py-2 text-[12.5px] text-muted-foreground">{b.purpose}</p>}
      </button>
      {beforeFooter && <div className="border-t px-4 py-3">{beforeFooter}</div>}
      {footer && <div className="flex gap-2 border-t px-4 py-3">{footer}</div>}
    </Card>
  );
}

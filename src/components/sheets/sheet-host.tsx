'use client';

import * as React from 'react';
import { useApp } from '@/lib/store';
import { SheetState } from '@/types';
import { BookSheet } from './book-sheet';
import { BookingSheet } from './booking-sheet';
import { ReviewSheet } from './review-sheet';
import { ReturnSheet } from './return-sheet';
import { MaintenanceSheet } from './maintenance-sheet';
import { NotificationsSheet } from './notifications-sheet';
import { KpiSheet } from './kpi-sheet';

type Of<T extends NonNullable<SheetState>['type']> = Extract<NonNullable<SheetState>, { type: T }>;

/**
 * Renders every sheet; only the active one is open. Each sheet keeps its last
 * params so content stays put during the close animation.
 */
export function SheetHost() {
  const { sheet } = useApp();
  const last = React.useRef<Partial<{ [K in NonNullable<SheetState>['type']]: Of<K> }>>({});
  if (sheet) (last.current as Record<string, SheetState>)[sheet.type] = sheet;
  const is = (type: NonNullable<SheetState>['type']) => sheet?.type === type;
  const l = last.current;

  return (
    <>
      <BookSheet open={is('book')} init={l.book ?? {}} />
      <BookingSheet open={is('booking')} id={l.booking?.id} />
      <ReviewSheet open={is('review')} id={l.review?.id} />
      <ReturnSheet open={is('return')} id={l.return?.id} mode={l.return?.mode ?? 'early'} />
      <MaintenanceSheet open={is('maintenance')} carId={l.maintenance?.carId} defaultMode={l.maintenance?.mode} />
      <NotificationsSheet open={is('notifications')} />
      <KpiSheet open={is('kpi')} kind={l.kpi?.kind} />
    </>
  );
}

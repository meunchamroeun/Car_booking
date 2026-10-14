'use client';

import * as React from 'react';
import { CalendarPlus, CalendarX2, Plus } from 'lucide-react';
import { useApp } from '@/lib/store';
import { isUpcoming } from '@/lib/selectors';
import { Booking } from '@/types';
import { PageHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { TripCard } from '@/components/common/trip-card';

type Filter = 'active' | 'pending' | 'history';

const key = (b: Booking) => b.startDate + b.startTime;

export function TripsScreen() {
  const { bookings, currentUser, t, setCurrentTab, lastCreatedId } = useApp();
  const goBook = () => {
    setCurrentTab('home');
    window.scrollTo({ top: 0 });
  };
  const mine = bookings.filter(b => b.requesterId === currentUser.id);

  const groups: Record<Filter, Booking[]> = {
    active: mine.filter(b => b.status === 'Approved' && isUpcoming(b)).sort((a, b) => key(a).localeCompare(key(b))),
    pending: mine.filter(b => b.status === 'Pending').sort((a, b) => key(a).localeCompare(key(b))),
    history: mine.filter(b => !(b.status === 'Pending' || (b.status === 'Approved' && isUpcoming(b)))).sort((a, b) => key(b).localeCompare(key(a))),
  };
  const [filter, setFilter] = React.useState<Filter>(() =>
    lastCreatedId && groups.pending.some(b => b.id === lastCreatedId) ? 'pending' : groups.active.length ? 'active' : 'pending'
  );
  const list = groups[filter];

  return (
    <div>
      <PageHeader
        title={t('trips_title')}
        subtitle={t('trips_sub')}
        action={
          <Button size="icon" onClick={goBook} aria-label={t('new_booking')}>
            <Plus />
          </Button>
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'active', label: t('f_active'), count: groups.active.length },
          { value: 'pending', label: t('f_pending'), count: groups.pending.length },
          { value: 'history', label: t('f_history') },
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.length ? (
          list.map(b => <TripCard key={b.id} b={b} />)
        ) : (
          <EmptyState
            icon={<CalendarX2 />}
            title={t('no_trips')}
            desc={t('no_trips_desc')}
            action={
              filter !== 'history' && (
                <Button onClick={goBook}>
                  <CalendarPlus /> {t('quick_book')}
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  );
}

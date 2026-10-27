'use client';

import * as React from 'react';
import { CheckCircle2, Phone, Route } from 'lucide-react';
import { useApp } from '@/lib/store';
import { driverTrips } from '@/lib/selectors';
import { canCompleteTask, canStartTask } from '@/lib/permissions';
import { DateUtil } from '@/lib/date-utils';
import { PageHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { TripCard } from '@/components/common/trip-card';

export function TasksScreen() {
  const app = useApp();
  const { currentUser, users, t, lang, startTask, openSheet } = app;
  const [filter, setFilter] = React.useState<'active' | 'done'>('active');
  const d = driverTrips(app, currentUser.driverId);
  const list = filter === 'active' ? d.active : d.done;

  return (
    <div>
      <PageHeader title={t('tasks_title')} subtitle={t('tasks_sub')} />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'active', label: t('f_active'), count: d.active.length },
          { value: 'done', label: t('f_done') },
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.length === 0 && <EmptyState icon={<Route />} title={t('no_tasks')} desc={t('no_tasks_desc')} />}
        {list.map(b => {
          const passenger = users.find(u => u.id === b.requesterId);
          const footer =
            filter === 'active' ? (
              <>
                {passenger?.phone && (
                  <Button variant="outline" size="sm" className="h-10" asChild>
                    <a href={`tel:${passenger.phone.replace(/\s/g, '')}`}>
                      <Phone /> {t('call')}
                    </a>
                  </Button>
                )}
                {canStartTask(currentUser, b) && (
                  <Button size="sm" className="h-10 flex-1" onClick={() => startTask(b.id)}>
                    <Route /> {t('start_trip')}
                  </Button>
                )}
                {canCompleteTask(currentUser, b) && (
                  <Button variant="success" size="sm" className="h-10 flex-1" onClick={() => openSheet({ type: 'return', id: b.id, mode: 'complete' })}>
                    <CheckCircle2 /> {t('complete_trip')}
                  </Button>
                )}
                {!canStartTask(currentUser, b) && !canCompleteTask(currentUser, b) && (
                  <span className="flex flex-1 items-center justify-center text-[12.5px] font-medium text-muted-foreground">{t('not_today', { date: DateUtil.friendly(b.startDate, lang) })}</span>
                )}
              </>
            ) : undefined;
          return <TripCard key={b.id} b={b} perspective="driver" footer={footer} />;
        })}
      </div>
    </div>
  );
}

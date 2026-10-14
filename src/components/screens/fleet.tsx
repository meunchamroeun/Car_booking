'use client';

import * as React from 'react';
import { ChevronRight, Gauge, Phone, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { PageHeader, Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/segmented';
import { CarPhoto } from '@/components/common/car-photo';

export function FleetScreen() {
  const { t } = useApp();
  const [tab, setTab] = React.useState<'vehicles' | 'drivers'>('vehicles');
  return (
    <div>
      <PageHeader title={t('fleet_title')} subtitle={t('fleet_sub')} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'vehicles', label: t('tab_vehicles') },
          { value: 'drivers', label: t('tab_drivers') },
        ]}
      />
      <div className="mt-4">{tab === 'vehicles' ? <VehicleList /> : <DriverList />}</div>
    </div>
  );
}

function VehicleList() {
  const { cars, t, lang, openSheet, isCarInMaintenance } = useApp();
  return (
    <Card className="divide-y">
      {cars.map(c => {
        const service = isCarInMaintenance(c.id, DateUtil.todayStr());
        const scheduled = !service && c.maintenance?.mode === 'scheduled';
        return (
          <button key={c.id} type="button" onClick={() => openSheet({ type: 'maintenance', carId: c.id })} className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40">
            <CarPhoto car={c} className="h-11 w-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{c.name}</p>
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="font-mono">{c.plate}</span>
                {c.odometer && (
                  <span className="flex items-center gap-1">
                    <Gauge className="size-3" />
                    {t('odo', { km: c.odometer.toLocaleString() })}
                  </span>
                )}
              </p>
              {scheduled && (
                <p className="mt-0.5 text-[11.5px] font-medium text-warning">
                  <Wrench className="mr-1 inline size-3" />
                  {DateUtil.friendly(c.maintenance!.startDate!, lang)} – {DateUtil.friendly(c.maintenance!.endDate!, lang)}
                </p>
              )}
            </div>
            <Badge tone={service ? 'warning' : 'success'} dot>
              {service ? t('st_service') : t('st_available')}
            </Badge>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        );
      })}
    </Card>
  );
}

function DriverList() {
  const { drivers, bookings, t, toggleDriverDuty } = useApp();
  return (
    <Card className="divide-y">
      {drivers.map(d => {
        const today = bookings.filter(b => b.driverId === d.id && b.startDate === DateUtil.todayStr() && b.status === 'Approved');
        const live = today.find(b => b.taskStatus === 'In Progress');
        return (
          <div key={d.id} className="flex items-center gap-3 p-3.5">
            <Avatar initials={d.name.split(' ').map(x => x[0]).join('')} seed={d.id} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-[14px] font-semibold">
                {d.name}
                {live && (
                  <Badge tone="info" dot>
                    {t('st_In Progress')}
                  </Badge>
                )}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {d.status === 'Active' ? t('trips_today_n', { n: today.length }) : t('off_duty')} · {d.licenseNo}
              </p>
            </div>
            <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground" aria-label={`${t('call')} ${d.name}`}>
              <Phone className="size-4" />
            </a>
            <Switch checked={d.status === 'Active'} onCheckedChange={() => toggleDriverDuty(d.id)} label={`${d.name} ${t('on_duty')}`} />
          </div>
        );
      })}
    </Card>
  );
}

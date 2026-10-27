'use client';

import * as React from 'react';
import { Bell, Check, ChevronDown, ChevronRight, Languages, Mail, Moon, Phone, RotateCcw, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { UserRole } from '@/types';
import { can } from '@/lib/permissions';
import { DateUtil } from '@/lib/date-utils';
import { getNotificationPermissionStatus, requestNotificationPermission } from '@/lib/badging';
import { Card, SectionHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/segmented';
import { CarPhoto } from '@/components/common/car-photo';
import { cn } from '@/lib/utils';

// Driver accounts are not offered in the demo; company drivers are still assigned to bookings
const ROLE_ORDER: UserRole[] = ['Employee', 'Approver', 'Admin'];
// Shown first in Demo accounts: ចាន់តារា សូនី (staff), មុន្នី អ៊ឹង (manager), ប៊ុនណារ័ត្ន ឈុំ (fleet admin)
const PINNED_ACCOUNTS = ['u7', 'a2', 'a1'];

export function ProfileScreen() {
  const { currentUser, users, cars, t, theme, setTheme, lang, setLang, switchUser, resetDemoData, isCarInMaintenance, openSheet } = useApp();
  const [showMaintenance, setShowMaintenance] = React.useState(false);
  const [notifPerm, setNotifPerm] = React.useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');

  React.useEffect(() => {
    setNotifPerm(getNotificationPermissionStatus());
  }, []);

  const handleRequestPerm = async () => {
    const granted = await requestNotificationPermission();
    setNotifPerm(granted ? 'granted' : getNotificationPermissionStatus());
  };

  const canManageMaintenance = can(currentUser, 'vehicle.maintenance');
  const inServiceCount = cars.filter(c => isCarInMaintenance(c.id, DateUtil.todayStr())).length;
  const scheduledCount = cars.filter(c => !isCarInMaintenance(c.id, DateUtil.todayStr()) && c.maintenance?.mode === 'scheduled').length;

  return (
    <div className="pt-2">
      <Card className="hero-pattern overflow-hidden border-0 bg-navy p-5 text-navy-foreground">
        <div className="flex items-center gap-4">
          <Avatar initials={currentUser.initials} seed={currentUser.id} src={currentUser.avatarUrl} className="size-16 text-[20px] ring-4 ring-white/15" />
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold leading-tight">{currentUser.name}</p>
            <p className="truncate text-[13px] text-white/65">{currentUser.dept}</p>
            <Badge tone="glass" className="mt-1.5">
              {t(`role_${currentUser.role}`)}
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-1 text-[13px] text-white/75">
          {currentUser.email && (
            <p className="flex items-center gap-2">
              <Mail className="size-3.5" /> {currentUser.email}
            </p>
          )}
          {currentUser.phone && (
            <p className="flex items-center gap-2">
              <Phone className="size-3.5" /> {currentUser.phone}
            </p>
          )}
        </div>
      </Card>

      <SectionHeader title={t('settings')} />
      <Card className="divide-y">
        <div className="flex items-center gap-3 p-3.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Moon className="size-[18px]" />
          </span>
          <span className="flex-1 text-[14px] font-semibold">{t('appearance')}</span>
          <Switch checked={theme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')} label={t('appearance')} />
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Languages className="size-[18px]" />
          </span>
          <span className="flex-1 text-[14px] font-semibold">{t('language')}</span>
          <Segmented
            size="sm"
            className="w-[150px]"
            value={lang}
            onChange={setLang}
            options={[
              { value: 'en', label: 'EN' },
              { value: 'kh', label: 'ខ្មែរ' },
            ]}
          />
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Bell className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{t('badge_notif_title')}</p>
            <p className="truncate text-[12px] text-muted-foreground">{t('badge_notif_sub')}</p>
          </div>
          {notifPerm === 'granted' ? (
            <Badge tone="success" dot>
              {t('badge_enabled')}
            </Badge>
          ) : notifPerm === 'denied' ? (
            <Badge tone="neutral">
              {t('badge_denied')}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-[12px]" onClick={handleRequestPerm}>
              {t('badge_enable')}
            </Button>
          )}
        </div>
        {canManageMaintenance && (
          <div>
            <button
              type="button"
              onClick={() => setShowMaintenance(v => !v)}
              className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40"
              aria-expanded={showMaintenance}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Wrench className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-[14px] font-semibold">{t('set_service_title')}</span>
                <p className="text-[12px] text-muted-foreground">
                  {inServiceCount > 0
                    ? `${inServiceCount} ${t('st_service')}`
                    : scheduledCount > 0
                      ? `${scheduledCount} ${t('mode_scheduled')}`
                      : t('st_available')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inServiceCount > 0 ? (
                  <Badge tone="warning" dot>
                    {inServiceCount} {t('st_service')}
                  </Badge>
                ) : (
                  <Badge tone="success" dot>
                    {t('st_available')}
                  </Badge>
                )}
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', showMaintenance && 'rotate-180')} />
              </div>
            </button>

            {showMaintenance && (
              <div className="divide-y border-t bg-muted/20">
                {cars.map(c => {
                  const service = isCarInMaintenance(c.id, DateUtil.todayStr());
                  const scheduled = !service && c.maintenance?.mode === 'scheduled';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openSheet({ type: 'maintenance', carId: c.id })}
                      className="flex w-full items-center gap-3 p-3.5 pl-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <CarPhoto car={c} className="h-10 w-14 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold">{c.name}</p>
                        <p className="truncate text-[11.5px] text-muted-foreground">
                          <span className="font-mono">{c.plate}</span> · {t(`type_${c.type}`)}
                        </p>
                        {service && c.maintenance?.reason && (
                          <p className="mt-0.5 truncate text-[11.5px] font-medium text-warning">
                            <Wrench className="mr-1 inline size-3" />
                            {c.maintenance.reason}
                          </p>
                        )}
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
              </div>
            )}
          </div>
        )}
      </Card>

      <SectionHeader title={t('switch_account')} action={<span className="text-[12px] text-muted-foreground">{t('switch_hint')}</span>} />
      <Card className="divide-y">
        {[...PINNED_ACCOUNTS.map(id => users.find(u => u.id === id)).filter((u): u is NonNullable<typeof u> => !!u && ROLE_ORDER.includes(u.role)), ...ROLE_ORDER.flatMap(role => users.filter(u => u.role === role && !PINNED_ACCOUNTS.includes(u.id)))].map(u => {
          const active = u.id === currentUser.id;
          return (
            <button key={u.id} type="button" onClick={() => !active && switchUser(u.id)} className={cn('flex w-full items-center gap-3 p-3.5 text-left transition-colors', active ? 'bg-primary-soft/60' : 'hover:bg-muted/40')}>
              <Avatar initials={u.initials} seed={u.id} src={u.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  {u.name}
                  {u.nameKm && <span className="font-normal text-muted-foreground text-[12px]">({u.nameKm})</span>}
                  <Badge tone={u.role === 'Admin' ? 'primary' : u.role === 'Approver' ? 'info' : u.role === 'Driver' ? 'warning' : 'neutral'}>{t(`role_${u.role}`)}</Badge>
                </p>
                <p className="truncate text-[12px] text-muted-foreground">{t(`role_desc_${u.role}`)}</p>
              </div>
              {active && <Check className="size-5 shrink-0 text-primary" />}
            </button>
          );
        })}
      </Card>

      <Button
        variant="destructive-soft"
        className="mt-4 w-full"
        onClick={() => {
          if (window.confirm(t('reset_confirm'))) resetDemoData();
        }}
      >
        <RotateCcw /> {t('reset_data')}
      </Button>
      <details className="mt-4 rounded-xl border bg-card px-3.5 py-3 text-[12px] text-muted-foreground">
        <summary className="cursor-pointer text-[13px] font-semibold text-foreground">{t('photo_credits')}</summary>
        <ul className="mt-2 space-y-1">
          {cars
            .filter(c => c.imageCredit)
            .map(c => (
              <li key={c.id}>
                <span className="font-medium text-foreground/80">{c.name}</span> — {c.imageCredit}
              </li>
            ))}
        </ul>
      </details>
      <p className="mt-6 text-center text-[11.5px] text-muted-foreground">OONE Power Technology · Fleet v3 ({t('demo_data')})</p>
    </div>
  );
}

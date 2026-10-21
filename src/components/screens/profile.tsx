'use client';

import * as React from 'react';
import { Check, Languages, Mail, Moon, Phone, RotateCcw } from 'lucide-react';
import { useApp } from '@/lib/store';
import { UserRole } from '@/types';
import { Card, SectionHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/segmented';
import { cn } from '@/lib/utils';

// Driver accounts are not offered in the demo; company drivers are still assigned to bookings
const ROLE_ORDER: UserRole[] = ['Employee', 'Approver', 'Admin'];

export function ProfileScreen() {
  const { currentUser, users, cars, t, theme, setTheme, lang, setLang, switchUser, resetDemoData } = useApp();

  return (
    <div className="pt-2">
      <Card className="hero-pattern overflow-hidden border-0 bg-navy p-5 text-navy-foreground">
        <div className="flex items-center gap-4">
          <Avatar initials={currentUser.initials} seed={currentUser.id} className="size-16 text-[20px] ring-4 ring-white/15" />
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold leading-tight">{currentUser.name}</p>
            <p className="truncate text-[13px] text-white/65">{currentUser.dept}</p>
            <Badge tone="glass" className="mt-1.5">
              {t(`role_${currentUser.role}`)}
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-1 text-[13px] text-white/75">
          <p className="flex items-center gap-2">
            <Mail className="size-3.5" /> {currentUser.email}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-3.5" /> {currentUser.phone}
          </p>
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
      </Card>

      <SectionHeader title={t('switch_account')} action={<span className="text-[12px] text-muted-foreground">{t('switch_hint')}</span>} />
      <Card className="divide-y">
        {ROLE_ORDER.flatMap(role => users.filter(u => u.role === role)).map(u => {
          const active = u.id === currentUser.id;
          return (
            <button key={u.id} type="button" onClick={() => !active && switchUser(u.id)} className={cn('flex w-full items-center gap-3 p-3.5 text-left transition-colors', active ? 'bg-primary-soft/60' : 'hover:bg-muted/40')}>
              <Avatar initials={u.initials} seed={u.id} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  {u.name}
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

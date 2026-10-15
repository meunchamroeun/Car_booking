'use client';

import * as React from 'react';
import { CalendarClock, CarFront, CheckCircle2, Clock, ShieldX, UserRound, XCircle } from 'lucide-react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { passStatus, readPass } from '@/lib/pass';
import { OoneMark } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Opened by scanning a vehicle pass QR (<app>/?pass=…). Works on any phone — the guard
 * doesn't need an account — and re-checks the time every 30 seconds.
 */
export function PassCheck({ token }: { token: string }) {
  const { t, lang } = useApp();
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const p = readPass(token);
  const status = p ? passStatus(p) : 'invalid';
  const look = {
    valid: { icon: CheckCircle2, tone: 'bg-success text-white', title: t('pc_valid'), desc: t('pc_valid_desc') },
    early: { icon: Clock, tone: 'bg-warning text-white', title: t('pc_early'), desc: p ? t('pc_early_desc', { time: p.st }) : '' },
    expired: { icon: XCircle, tone: 'bg-destructive text-white', title: t('pc_expired'), desc: p ? t('pc_expired_desc', { time: p.et }) : '' },
    invalid: { icon: ShieldX, tone: 'bg-destructive text-white', title: t('pc_invalid'), desc: t('pc_invalid_desc') },
  }[status];

  return (
    <div className="min-h-dvh bg-muted/40">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background p-4 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <OoneMark className="size-[18px]" />
          </span>
          <p className="text-[15px] font-bold">{t('pc_title')}</p>
        </div>

        {/* Big result the guard can read at a glance */}
        <div className={cn('mt-5 flex flex-col items-center rounded-3xl p-6 text-center shadow-float animate-in fade-in-0 zoom-in-95 duration-300', look.tone)}>
          <look.icon className="size-16" strokeWidth={1.8} />
          <p className="mt-2 text-[28px] font-bold leading-tight">{look.title}</p>
          <p className="mt-1 text-[14px] opacity-90">{look.desc}</p>
        </div>

        {p && (
          <div className="mt-4 divide-y rounded-2xl border bg-card">
            <Row icon={<span className="font-mono text-[11px] font-bold">#</span>} label={t('booking')} value={<span className="font-mono">{p.id}</span>} />
            <Row icon={<CarFront />} label={t('vehicle')} value={p.car} sub={<span className="font-mono">{p.plate}</span>} />
            <Row icon={<UserRound />} label={t('requester')} value={p.name} sub={p.dept} />
            {p.drv && <Row icon={<UserRound />} label={t('driver')} value={p.drv} />}
            <Row
              icon={<CalendarClock />}
              label={t('schedule')}
              value={DateUtil.window({ startDate: p.sd, startTime: p.st, endDate: p.ed, endTime: p.et }, lang)}
            />
          </div>
        )}

        <p className="mt-3 text-center text-[12px] tabular text-muted-foreground">{t('pc_checked_at', { time: DateUtil.nowTimeStr() })}</p>

        <div className="mt-auto space-y-3 pt-6">
          <p className="text-center text-[11.5px] text-muted-foreground">{t('pc_demo_note')}</p>
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/')}>
            {t('pc_open_app')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="text-[15px] font-semibold">{value}</p>
        {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

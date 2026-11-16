'use client';

import { MaintenanceInfo } from '@/types';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';

/** Shared date/time and reason content; surrounding cards keep their own style. */
export function MaintenanceDetails({ maintenance, warning = false }: { maintenance?: MaintenanceInfo | null; warning?: boolean }) {
  const { t, lang } = useApp();
  const start = maintenance?.mode === 'scheduled'
    ? maintenance.startDate
      ? `${DateUtil.formatDate(maintenance.startDate, lang)} · ${maintenance.startTime || '00:00'}`
      : t('maint_time_unknown')
    : maintenance?.setAt
      ? `${DateUtil.formatDate(maintenance.setAt.slice(0, 10), lang)} · ${maintenance.setAt.slice(11, 16)}`
      : maintenance?.mode === 'manual' ? t('mode_manual') : t('maint_time_unknown');
  const end = maintenance?.mode === 'scheduled' && (maintenance.endDate || maintenance.startDate)
    ? `${DateUtil.formatDate(maintenance.endTime
      ? (maintenance.endDate || maintenance.startDate)!
      : DateUtil.addDays((maintenance.endDate || maintenance.startDate)!, 1), lang)} · ${maintenance.endTime || '00:00'}`
    : maintenance?.mode === 'manual' ? t('maint_until_available') : t('maint_time_unknown');
  const labelClass = warning ? 'text-warning/80' : 'text-muted-foreground';

  return (
    <>
      <dl className={`mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 ${warning ? '' : 'text-foreground/80'}`}>
        <dt className={labelClass}>{t('from_date')}</dt>
        <dd className="min-w-0 break-words font-medium tabular">{start}</dd>
        <dt className={labelClass}>{t('to_date')}</dt>
        <dd className="min-w-0 break-words font-medium tabular">{end}</dd>
        {maintenance?.mode === 'manual' && maintenance.estimatedDate && (
          <>
            <dt className={labelClass}>{t('est_return')}</dt>
            <dd className="min-w-0 break-words tabular">{DateUtil.formatDate(maintenance.estimatedDate, lang)} · {t('maint_estimate_only')}</dd>
          </>
        )}
      </dl>
      {maintenance?.reason?.trim() && (
        <p className={`mt-2 min-w-0 whitespace-pre-wrap break-words border-t border-warning/15 pt-2 [overflow-wrap:anywhere] ${warning ? '' : 'text-foreground/80'}`}>
          <span className={labelClass}>{t('reason')} : </span>
          {maintenance.reason.trim()}
        </p>
      )}
    </>
  );
}

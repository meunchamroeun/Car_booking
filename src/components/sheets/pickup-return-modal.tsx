'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DateUtil } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';

export type DayBookingStatus = 'free' | 'part_day' | 'all_day' | 'service';

export function PickupReturnModal({
  open,
  onOpenChange,
  startDate,
  endDate,
  minDate,
  initialMode = 'start',
  onChange,
  getBookingStatus,
  lang = 'en',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate: string;
  minDate: string;
  initialMode?: 'start' | 'end';
  onChange: (start: string, end: string) => void;
  getBookingStatus?: (dateStr: string) => DayBookingStatus;
  lang?: 'en' | 'kh';
}) {
  const { t } = useApp();
  const [picking, setPicking] = React.useState<'start' | 'end'>(initialMode);
  const [month, setMonth] = React.useState(() => (startDate || minDate).slice(0, 7));

  // Sync initial mode when reopened
  React.useEffect(() => {
    if (open) {
      setPicking(initialMode);
      setMonth((initialMode === 'start' ? startDate : endDate || startDate || minDate).slice(0, 7));
    }
  }, [open, initialMode, startDate, endDate, minDate]);

  const [y, m] = month.split('-').map(Number);
  const daysInCurrentMonth = new Date(y, m, 0).getDate();
  const firstDayWeekday = new Date(y, m - 1, 1).getDay(); // Sunday = 0, Monday = 1...

  // Days in previous month
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonthNum = m === 1 ? 12 : m - 1;
  const daysInPrevMonth = new Date(y, m - 1, 0).getDate();

  // Next month info
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonthNum = m === 12 ? 1 : m + 1;

  // Build full 42 cells (6 rows of 7 days)
  const cells: { dateStr: string; dayNum: number; type: 'prev' | 'current' | 'next' }[] = [];

  // Previous month trailing days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const dNum = daysInPrevMonth - i;
    cells.push({
      dateStr: `${prevYear}-${DateUtil.pad(prevMonthNum)}-${DateUtil.pad(dNum)}`,
      dayNum: dNum,
      type: 'prev',
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    cells.push({
      dateStr: `${month}-${DateUtil.pad(d)}`,
      dayNum: d,
      type: 'current',
    });
  }

  // Next month leading days to complete 42 cells
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      dateStr: `${nextYear}-${DateUtil.pad(nextMonthNum)}-${DateUtil.pad(nextDay)}`,
      dayNum: nextDay,
      type: 'next',
    });
    nextDay++;
  }

  const names = DateUtil.names(lang);
  const monthName = names.monthLong[m - 1];
  const monthHeaderLabel = `${monthName} ${y}`;

  // Sunday-first weekday headers: Su, Mo, Tu, We, Th, Fr, Sa
  const weekdayLabels = lang === 'kh'
    ? ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const canPrev = month > minDate.slice(0, 7);

  const shiftMonth = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${DateUtil.pad(d.getMonth() + 1)}`);
  };

  const handleDayClick = (d: string) => {
    if (d < minDate) return;
    const status = getBookingStatus?.(d);
    if (status === 'service') return;

    if (picking === 'start') {
      const nextEnd = endDate < d ? d : endDate;
      onChange(d, nextEnd);
      setPicking('end');
    } else {
      if (d < startDate) {
        onChange(d, d);
        setPicking('end');
      } else {
        onChange(startDate, d);
      }
    }
  };

  // Format "Tue 27/10"
  const formatDateSlash = (dateStr: string) => {
    if (!dateStr) return '—';
    const [yr, mo, da] = dateStr.split('-').map(Number);
    const wd = new Date(yr, mo - 1, da).getDay();
    const dayShort = names.dayShort[wd];
    return `${dayShort} ${DateUtil.pad(da)}/${DateUtil.pad(mo)}`;
  };

  const diffDays = Math.max(1, DateUtil.dayDiff(startDate, endDate) + 1);
  const daysText = diffDays === 1 ? t('day_count', { n: 1 }) : t('days_count', { n: diffDays });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-[81] mx-auto flex max-h-[92dvh] w-full max-w-[430px] flex-col overflow-y-auto overscroll-contain rounded-t-[28px] bg-background p-4 sm:p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-float outline-none border-t sm:border-x sm:border-border',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200'
          )}
        >
          {/* Top drag handle indicator */}
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />

          {/* Header title & close button */}
          <div className="flex items-center justify-between pb-3">
            <Dialog.Title className="text-[17px] font-bold tracking-tight text-foreground">
              {t('pickup_return_dates')}
            </Dialog.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t('close')}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Pick-up / Return date selector cards */}
          <div className="flex items-center gap-2 pb-3">
            {/* Pick-up Card */}
            <button
              type="button"
              onClick={() => {
                setPicking('start');
                setMonth(startDate.slice(0, 7));
              }}
              className={cn(
                'flex-1 rounded-2xl p-2.5 sm:p-3 text-left transition-all',
                picking === 'start'
                  ? 'border-2 border-foreground dark:border-white bg-background shadow-xs'
                  : 'border-2 border-transparent bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-750'
              )}
            >
              <span className="block text-[12px] font-semibold text-muted-foreground">
                {t('pick_up')}
              </span>
              <span className="mt-0.5 block text-[15px] sm:text-[16px] font-black tracking-tight text-foreground tabular">
                {formatDateSlash(startDate)}
              </span>
            </button>

            {/* Days count in the center */}
            <span className="shrink-0 text-[12.5px] font-bold text-muted-foreground tabular px-1">
              {daysText}
            </span>

            {/* Return Card */}
            <button
              type="button"
              onClick={() => {
                setPicking('end');
                setMonth(endDate.slice(0, 7));
              }}
              className={cn(
                'flex-1 rounded-2xl p-2.5 sm:p-3 text-left transition-all',
                picking === 'end'
                  ? 'border-2 border-foreground dark:border-white bg-background shadow-xs'
                  : 'border-2 border-transparent bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-750'
              )}
            >
              <span className="block text-[12px] font-semibold text-muted-foreground">
                {t('return_label')}
              </span>
              <span className="mt-0.5 block text-[15px] sm:text-[16px] font-black tracking-tight text-foreground tabular">
                {formatDateSlash(endDate)}
              </span>
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-1 py-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={!canPrev}
              className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-20"
              aria-label={t('a11y_prev_month')}
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-[16px] font-bold text-foreground">
              {monthHeaderLabel}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label={t('a11y_next_month')}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Weekday headers: Su Mo Tu We Th Fr Sa */}
          <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-muted-foreground py-1">
            {weekdayLabels.map((lbl, idx) => (
              <span key={idx} className="py-0.5">
                {lbl}
              </span>
            ))}
          </div>

          {/* 6x7 Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1" role="grid">
            {cells.map((cell, idx) => {
              const col = idx % 7;
              if (cell.type !== 'current') {
                return (
                  <div key={cell.dateStr + idx} className="flex h-10 items-center justify-center">
                    <span className="text-[14px] font-medium text-neutral-300 dark:text-neutral-600 select-none">
                      {cell.dayNum}
                    </span>
                  </div>
                );
              }

              const d = cell.dateStr;
              const isPast = d < minDate;
              const isStart = d === startDate;
              const isEnd = d === endDate;
              const isSelected = isStart || isEnd;
              const inRange = d > startDate && d < endDate;
              const status = getBookingStatus?.(d) ?? 'free';
              const disabled = isPast || status === 'service';

              return (
                <div
                  key={d}
                  className={cn(
                    'relative flex h-10 items-center justify-center',
                    // Continuous amber range band behind the days
                    inRange && 'bg-amber-100 dark:bg-amber-950/40',
                    isStart && endDate > startDate && 'rounded-l-2xl bg-amber-100 dark:bg-amber-950/40',
                    isEnd && endDate > startDate && 'rounded-r-2xl bg-amber-100 dark:bg-amber-950/40',
                    inRange && col === 0 && 'rounded-l-2xl',
                    inRange && col === 6 && 'rounded-r-2xl'
                  )}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDayClick(d)}
                    className={cn(
                      'relative flex size-9 flex-col items-center justify-center rounded-xl text-[14.5px] font-bold tabular transition-transform active:scale-95 disabled:cursor-not-allowed',
                      isSelected
                        ? 'bg-[#facc15] text-black font-extrabold shadow-sm'
                        : inRange
                        ? 'text-amber-950 dark:text-amber-200 hover:bg-amber-200/50'
                        : disabled
                        ? 'font-medium text-neutral-300 dark:text-neutral-600'
                        : 'text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    <span>{cell.dayNum}</span>

                    {/* Underline for active start/end date */}
                    {isSelected ? (
                      <span className="mt-0.5 block h-[2.5px] w-3.5 rounded-full bg-black" />
                    ) : (
                      <>
                        {/* Booking indicator dash/bar matching Image 2 */}
                        {status === 'part_day' && !disabled && (
                          <span className="mt-0.5 block h-[2.5px] w-3 rounded-full bg-neutral-900 dark:bg-neutral-200" />
                        )}
                        {status === 'all_day' && !disabled && (
                          <span className="mt-0.5 block h-[2.5px] w-3.5 rounded-full bg-amber-600 dark:bg-amber-500" />
                        )}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legend Row */}
          <div className="mt-3.5 flex items-center gap-5 px-1 text-[12px] font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="block h-[2.5px] w-3 rounded-full bg-neutral-900 dark:bg-neutral-200" />
              <span>{t('booked_part_day')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="block h-[2.5px] w-3.5 rounded-full bg-amber-600 dark:bg-amber-500" />
              <span>{t('booked_all_day')}</span>
            </div>
          </div>

          {/* Bottom Divider & Helper text */}
          <div className="mt-3.5 border-t border-neutral-200/90 pt-3 dark:border-neutral-800">
            <p className="text-[14.5px] font-bold text-foreground">
              {picking === 'start' ? t('tap_pickup_day') : t('tap_return_day')}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

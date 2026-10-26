'use client';

import * as React from 'react';
import {
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Fuel,
  History,
  RotateCcw,
  Search,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Booking, Car } from '@/types';
import { PageHeader, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty';
import { DateKeyIn } from '@/components/ui/date-key-in';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { CarPhoto } from '@/components/common/car-photo';
import { BookingStatusBadge } from '@/components/common/status';
import { cn } from '@/lib/utils';

type HistoryScope = 'all' | 'cars' | 'mine';
type StatusFilter = 'all' | 'Completed' | 'Cancelled' | 'Rejected';
type PeriodFilter = 'all' | 'today' | 'this_month' | 'date';

const keyDesc = (b: Booking) => b.startDate + b.startTime;

export function HistoryScreen() {
  const { bookings, cars, users, drivers, currentUser, t, lang, openSheet } = useApp();

  const [scope, setScope] = React.useState<HistoryScope>('all');
  const [selectedCarId, setSelectedCarId] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = React.useState<PeriodFilter>('all');
  const [customDate, setCustomDate] = React.useState<string>('');
  const [calendarOpen, setCalendarOpen] = React.useState<boolean>(false);
  const [carDropdownOpen, setCarDropdownOpen] = React.useState<boolean>(false);
  const [carSearch, setCarSearch] = React.useState<string>('');
  const carSearchRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState('');

  // All historical bookings (Completed, Cancelled, Rejected, or past Approved)
  const allHistory = React.useMemo(() => {
    return bookings
      .filter(b => {
        // Exclude active pending or upcoming approved bookings
        if (b.status === 'Pending') return false;
        if (b.status === 'Approved') {
          const isPast = DateUtil.stamp(b.endDate || b.startDate, b.endTime) < DateUtil.nowStamp();
          return isPast;
        }
        return true;
      })
      .sort((a, b) => keyDesc(b).localeCompare(keyDesc(a)));
  }, [bookings]);

  const todayStr = React.useMemo(() => DateUtil.todayStr(), []);
  const currentMonthStr = todayStr.slice(0, 7); // "YYYY-MM"

  // Apply filters
  const filteredList = React.useMemo(() => {
    return allHistory.filter(b => {
      // Scope filter
      if (scope === 'mine' && b.requesterId !== currentUser.id) return false;
      if (scope === 'cars' && selectedCarId !== 'all' && b.carId !== selectedCarId) return false;
      if (scope !== 'cars' && selectedCarId !== 'all' && b.carId !== selectedCarId) return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Completed') {
          if (b.status !== 'Completed' && b.status !== 'Approved') return false;
        } else if (b.status !== statusFilter) {
          return false;
        }
      }

      // Period & Date filters
      const tripEnd = b.endDate || b.startDate;
      if (periodFilter === 'today') {
        if (!(b.startDate <= todayStr && tripEnd >= todayStr)) return false;
      } else if (periodFilter === 'this_month') {
        if (!b.startDate.startsWith(currentMonthStr) && !tripEnd.startsWith(currentMonthStr)) return false;
      } else if (periodFilter === 'date' && customDate) {
        if (!(b.startDate <= customDate && tripEnd >= customDate)) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const car = cars.find(c => c.id === b.carId);
        const requester = users.find(u => u.id === b.requesterId);
        const driver = drivers.find(d => d.id === b.driverId);

        const match =
          car?.name.toLowerCase().includes(q) ||
          car?.plate.toLowerCase().includes(q) ||
          requester?.name.toLowerCase().includes(q) ||
          requester?.dept.toLowerCase().includes(q) ||
          driver?.name.toLowerCase().includes(q) ||
          b.purpose.toLowerCase().includes(q) ||
          b.destination.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [allHistory, scope, selectedCarId, statusFilter, periodFilter, customDate, search, currentUser.id, cars, users, drivers, todayStr, currentMonthStr]);

  const selectedCar = React.useMemo(() => {
    return selectedCarId !== 'all' ? cars.find(c => c.id === selectedCarId) : null;
  }, [cars, selectedCarId]);

  // Car specific stats
  const carStats = React.useMemo(() => {
    if (!selectedCar) return null;
    const carBookings = allHistory.filter(b => b.carId === selectedCar.id);
    const completed = carBookings.filter(b => b.status === 'Completed' || b.status === 'Approved').length;
    const cancelled = carBookings.filter(b => b.status === 'Cancelled').length;
    return { total: carBookings.length, completed, cancelled };
  }, [allHistory, selectedCar]);

  const filteredCars = React.useMemo(() => {
    if (!carSearch.trim()) return cars;
    const q = carSearch.toLowerCase().trim();
    return cars.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.plate.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    );
  }, [cars, carSearch]);

  const resetFilters = () => {
    setSelectedCarId('all');
    setStatusFilter('all');
    setPeriodFilter('all');
    setCustomDate('');
    setCalendarOpen(false);
    setSearch('');
    setCarSearch('');
    setCarDropdownOpen(false);
  };

  const hasActiveFilters =
    selectedCarId !== 'all' ||
    statusFilter !== 'all' ||
    periodFilter !== 'all' ||
    !!customDate ||
    search.trim() !== '';

  return (
    <div className="space-y-3.5 pb-8 pt-1">
      <PageHeader
        title={t('history_title')}
        subtitle={t('history_sub')}
        action={
          <span className="rounded-full bg-primary-soft px-2.5 py-1 font-mono text-[11.5px] font-bold text-primary">
            {filteredList.length}
          </span>
        }
      />

      {/* Scope Segmented Control */}
      <Segmented
        value={scope}
        onChange={setScope}
        options={[
          { value: 'all', label: t('tab_all_history') },
          { value: 'cars', label: t('tab_car_history') },
          { value: 'mine', label: t('tab_my_history') },
        ]}
      />

      {/* Vehicle Selector (Dropdown) & Detail Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground">
            <CarFront className="size-3.5 text-primary" />
            <span>{t('tab_car_history')}</span>
          </p>
          {selectedCarId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCarId('all')}
              className="text-[11.5px] font-semibold text-primary hover:underline"
            >
              {t('all_vehicles')}
            </button>
          )}
        </div>

        {/* Dropdown Select Menu */}
        <Menu.Root open={carDropdownOpen} onOpenChange={setCarDropdownOpen} modal={false}>
          <Menu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-12 w-full items-center gap-2.5 rounded-xl border bg-card px-3 text-left transition-all shadow-2xs focus:outline-hidden',
                carDropdownOpen
                  ? 'border-primary ring-2 ring-primary/15'
                  : selectedCar
                  ? 'border-primary/40 bg-primary-soft/10 hover:border-primary/60'
                  : 'border-border/80 hover:border-primary/30 hover:bg-muted/30'
              )}
            >
              {selectedCar ? (
                <CarPhoto car={selectedCar} zoomable={false} className="size-8 shrink-0 rounded-lg object-cover shadow-2xs" />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary shadow-2xs">
                  <CarFront className="size-4.5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-bold text-foreground">
                    {selectedCar ? selectedCar.name : t('all_vehicles')}
                  </span>
                  {selectedCar ? (
                    <span className="rounded bg-primary-soft px-1.5 py-0.2 font-mono text-[10.5px] font-bold text-primary">
                      {selectedCar.plate}
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                      {cars.length}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {selectedCar
                    ? `${selectedCar.type} · ${selectedCar.seats} ${t('seats', { n: selectedCar.seats })} · ${carStats?.total ?? 0} ${t('total_trips')}`
                    : `${cars.length} ${t('vehicles')} · ${allHistory.length} ${t('total_trips')}`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {selectedCar && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedCarId('all');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setSelectedCarId('all');
                      }
                    }}
                    className="flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={t('all_vehicles')}
                  >
                    <X className="size-3.5" />
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                    carDropdownOpen && 'rotate-180'
                  )}
                />
              </div>
            </button>
          </Menu.Trigger>

          <Menu.Portal>
            <Menu.Content
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className="z-[70] w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-2xl border border-border/80 bg-card p-1.5 shadow-float outline-none animate-in fade-in-0 zoom-in-95"
            >
              {/* Search bar inside dropdown */}
              <div className="relative mb-1 p-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={carSearchRef}
                  value={carSearch}
                  onChange={e => setCarSearch(e.target.value)}
                  placeholder={t('search_history_ph')}
                  className="h-8.5 w-full rounded-xl border border-border/80 bg-background pl-8 pr-7 text-[12.5px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                  onClick={e => e.stopPropagation()}
                />
                {carSearch && (
                  <button
                    type="button"
                    onClick={() => setCarSearch('')}
                    className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="max-h-[280px] overflow-y-auto space-y-0.5">
                {/* All Vehicles option */}
                <Menu.Item
                  onSelect={() => {
                    setSelectedCarId('all');
                    setCarSearch('');
                  }}
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] outline-none transition-colors',
                    selectedCarId === 'all'
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      selectedCarId === 'all' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <CarFront className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t('all_vehicles')}</p>
                    <p className={cn('text-[11px]', selectedCarId === 'all' ? 'text-white/80' : 'text-muted-foreground')}>
                      {cars.length} {t('vehicles')} · {allHistory.length} {t('total_trips')}
                    </p>
                  </div>
                  {selectedCarId === 'all' && <Check className="size-4 shrink-0 text-white" strokeWidth={2.5} />}
                </Menu.Item>

                <div className="my-1 border-t border-border/60" />

                {/* Individual cars */}
                {filteredCars.map(c => {
                  const active = selectedCarId === c.id;
                  const count = allHistory.filter(b => b.carId === c.id).length;
                  return (
                    <Menu.Item
                      key={c.id}
                      onSelect={() => {
                        setSelectedCarId(c.id);
                        setCarSearch('');
                      }}
                      className={cn(
                        'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] outline-none transition-colors',
                        active
                          ? 'bg-primary font-semibold text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <CarPhoto car={c} className="size-8 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold">{c.name}</span>
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.2 font-mono text-[10.5px]',
                              active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {c.plate}
                          </span>
                        </div>
                        <p className={cn('text-[11px]', active ? 'text-white/80' : 'text-muted-foreground')}>
                          {c.type} · {c.seats} {t('seats', { n: c.seats })}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10.5px] font-bold',
                          active ? 'bg-white/25 text-white' : 'bg-muted text-foreground'
                        )}
                      >
                        {count}
                      </span>
                      {active && <Check className="size-4 shrink-0 text-white" strokeWidth={2.5} />}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </div>

      {/* Selected Vehicle Detail Card */}
      {selectedCar && carStats && (
        <Card className="overflow-hidden border border-primary/25 bg-gradient-to-br from-primary-soft/40 via-card to-background p-3.5 shadow-sm animate-in fade-in-0 duration-200">
          <div className="flex items-start gap-3.5">
            <CarPhoto car={selectedCar} zoomable className="h-20 w-28 shrink-0 rounded-xl shadow-xs object-cover border border-border/60" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold text-foreground leading-tight">{selectedCar.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-primary-soft px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                      {selectedCar.plate}
                    </span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                      {selectedCar.type}
                    </span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                      {selectedCar.seats} {t('seats', { n: selectedCar.seats })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCarId('all')}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
                  title={t('all_vehicles')}
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Extra specifications (Fuel, Color, Status) */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {selectedCar.fuel && (
                  <span className="flex items-center gap-1">
                    <Fuel className="size-3 text-primary" />
                    <span>{selectedCar.fuel}</span>
                  </span>
                )}
                {selectedCar.color && <span>· {selectedCar.color}</span>}
                <span className={cn('font-semibold', selectedCar.status === 'Active' ? 'text-success' : 'text-amber-600')}>
                  · {selectedCar.status === 'Active' ? '🟢 Active' : '🟡 Maintenance'}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Trips Analytics for this vehicle */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-2.5 text-center">
            <div className="rounded-xl bg-card/90 p-2 shadow-2xs border border-border/40">
              <p className="text-[10.5px] font-medium text-muted-foreground">{t('total_trips')}</p>
              <p className="text-[16px] font-bold text-primary tabular mt-0.5">{carStats.total}</p>
            </div>
            <div className="rounded-xl bg-card/90 p-2 shadow-2xs border border-border/40">
              <p className="text-[10.5px] font-medium text-muted-foreground">{t('status_completed')}</p>
              <p className="text-[16px] font-bold text-success tabular mt-0.5">{carStats.completed}</p>
            </div>
            <div className="rounded-xl bg-card/90 p-2 shadow-2xs border border-border/40">
              <p className="text-[10.5px] font-medium text-muted-foreground">{t('status_cancelled')}</p>
              <p className="text-[16px] font-bold text-muted-foreground tabular mt-0.5">{carStats.cancelled}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Search Input & Quick Filters */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_history_ph')}
            className="h-10 w-full rounded-xl border border-border/80 bg-card pl-9 pr-8 text-[13px] placeholder:text-muted-foreground/70 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { v: 'all', label: t('all_statuses') },
              { v: 'Completed', label: t('status_completed') },
              { v: 'Cancelled', label: t('status_cancelled') },
              { v: 'Rejected', label: t('status_rejected') },
            ] as const
          ).map(s => (
            <button
              key={s.v}
              type="button"
              onClick={() => setStatusFilter(s.v)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors',
                statusFilter === s.v
                  ? 'bg-foreground text-background shadow-2xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
            >
              <RotateCcw className="size-3" />
              {t('reset_filters')}
            </button>
          )}
        </div>

        {/* Date Filter: All | Today | This Month | Box for user key in */}
        <div className="space-y-2">
          <div
            className="grid grid-cols-[0.8fr_1fr_1.15fr_1.45fr] gap-0.5 rounded-xl bg-muted/60 p-0.5"
            role="radiogroup"
            aria-label={t('filter_by_date')}
          >
            <button
              type="button"
              role="radio"
              aria-checked={periodFilter === 'all'}
              onClick={() => {
                setPeriodFilter('all');
                setCustomDate('');
                setCalendarOpen(false);
              }}
              className={cn(
                'h-8 rounded-[10px] text-[12.5px] transition-all',
                periodFilter === 'all'
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              )}
            >
              {t('all')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={periodFilter === 'today'}
              onClick={() => {
                setPeriodFilter('today');
                setCalendarOpen(false);
              }}
              className={cn(
                'h-8 rounded-[10px] text-[12.5px] transition-all',
                periodFilter === 'today'
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              )}
            >
              {t('period_today')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={periodFilter === 'this_month'}
              onClick={() => {
                setPeriodFilter('this_month');
                setCalendarOpen(false);
              }}
              className={cn(
                'h-8 rounded-[10px] text-[12.5px] transition-all',
                periodFilter === 'this_month'
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              )}
            >
              {t('period_this_month')}
            </button>
            <DateKeyIn
              value={periodFilter === 'date' ? customDate : ''}
              min="2020-01-01"
              active={periodFilter === 'date'}
              open={calendarOpen}
              onChange={d => {
                setCustomDate(d);
                setPeriodFilter('date');
                setCalendarOpen(false);
              }}
              onToggle={() => setCalendarOpen(o => !o)}
              onOpen={() => setCalendarOpen(true)}
              label={t('key_in_date')}
              placeholder={t('date_ph')}
              pickLabel={t('select_date')}
            />
          </div>

          {/* Calendar popup when user taps the calendar icon or key-in box */}
          {calendarOpen && (
            <div className="animate-in fade-in-0 zoom-in-95">
              <RangeCalendar
                mode="single"
                start={customDate || todayStr}
                end={customDate || todayStr}
                min="2020-01-01"
                lang={lang}
                onChange={(s: string) => {
                  setCustomDate(s);
                  setPeriodFilter('date');
                  setCalendarOpen(false);
                }}
                onDone={() => setCalendarOpen(false)}
                labels={{
                  pickStart: t('cal_pick_start'),
                  pickSingle: t('cal_pick_single'),
                  pickEnd: t('cal_pick_end'),
                  booked: t('cal_booked'),
                  unavailable: t('unavailable'),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* History Booking List */}
      <div className="space-y-2.5">
        {filteredList.length > 0 ? (
          filteredList.map(b => (
            <HistoryBookingCard key={b.id} b={b} onClick={() => openSheet({ type: 'booking', id: b.id })} />
          ))
        ) : (
          <EmptyState
            icon={<History />}
            title={t('no_history')}
            desc={t('no_history_desc')}
            action={
              hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw className="size-3.5" />
                  {t('reset_filters')}
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  );
}

function HistoryBookingCard({ b, onClick }: { b: Booking; onClick: () => void }) {
  const { cars, users, drivers, t, lang } = useApp();
  const car = cars.find(c => c.id === b.carId);
  const requester = users.find(u => u.id === b.requesterId);
  const driver = drivers.find(d => d.id === b.driverId);

  const sameDay = (b.endDate || b.startDate) === b.startDate;
  const isRejected = b.status === 'Rejected';
  const isCancelled = b.status === 'Cancelled';

  return (
    <Card className="overflow-hidden transition-all hover:border-primary/40 hover:shadow-card active:scale-[0.995]">
      <button type="button" onClick={onClick} className="block w-full p-3 text-left">
        {/* Top: Car Name + Plate and Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CarPhoto car={car} className="size-8 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold leading-tight">{car?.name || '—'}</p>
              <span className="font-mono text-[11px] text-muted-foreground">{car?.plate}</span>
            </div>
          </div>
          <BookingStatusBadge b={b} />
        </div>

        {/* Date & Time Window */}
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[12px]">
          <Clock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            {DateUtil.friendly(b.startDate, lang)}
            {!sameDay && b.endDate ? ` → ${DateUtil.friendly(b.endDate, lang)}` : ''}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="tabular font-medium text-foreground/80">
            {b.startTime} – {b.actualEndTime || b.endTime}
          </span>
          {b.returnedEarly && (
            <Badge tone="success" className="ml-auto text-[10px] py-0 px-1.5">
              {t('return_early')}
            </Badge>
          )}
        </div>

        {/* Middle details: Requester & Driver */}
        <div className="mt-2.5 flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-1.5 truncate">
            <Avatar initials={requester?.initials ?? '?'} seed={requester?.id} src={requester?.avatarUrl} className="size-5 text-[9px]" />
            <span className="text-[12px] font-normal text-muted-foreground">{t('booking_by')} :</span>
            <span className="truncate font-semibold text-foreground">{requester?.name || '—'}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-[11.5px]">
            <UserRound className="size-3 text-muted-foreground" />
            {b.needDriver ? (
              <span className="font-medium text-foreground/85">{driver?.name || t('with_driver')}</span>
            ) : (
              <span className="text-muted-foreground">{t('self_drive')}</span>
            )}
          </div>
        </div>

        {/* Purpose / Destination */}
        {(b.purpose || b.destination) && (
          <div className="mt-2 truncate border-t border-border/60 pt-2 text-[12px]">
            <span className="font-normal text-muted-foreground">{t('purpose')} : </span>
            <span className="font-medium text-foreground/85">{b.purpose || '—'}</span>
            {b.destination && <span className="text-muted-foreground"> · {b.destination}</span>}
          </div>
        )}

        {/* Rejection / Cancellation reason if any */}
        {isRejected && b.rejectReason && (
          <p className="mt-2 rounded-md bg-destructive-soft px-2 py-1 text-[11px] font-medium text-destructive">
            {t('reject_reason')}: {b.rejectReason}
          </p>
        )}
        {isCancelled && b.cancelReason && (
          <p className="mt-2 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {t('cancel_reason')}: {b.cancelReason}
          </p>
        )}
      </button>
    </Card>
  );
}

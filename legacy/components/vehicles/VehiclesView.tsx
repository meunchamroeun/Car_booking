'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { CarIllustration } from '@/components/common/CarIllustrations';
import { DateUtil } from '@/lib/date-utils';
import { CarType } from '@/types';
import {
  Calendar,
  Search,
  LayoutGrid,
  Clock,
  MapPin,
  ArrowRight,
  RotateCcw,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  User,
  Zap,
} from 'lucide-react';

export function VehiclesView() {
  const {
    currentUser,
    cars,
    bookings,
    users,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isCarInMaintenance,
    openBookingModal,
    openPassModal,
    openEarlyReturnModal,
    showToast,
    t,
  } = useApp();

  const isToday = selectedDate === DateUtil.todayStr();
  const isTomorrow = selectedDate === DateUtil.tomorrowStr();

  // Find if user has active approved trip today
  const activeTrip = bookings.find(
    b => b.requesterId === currentUser.id && b.status === 'Approved' && b.startDate === DateUtil.todayStr()
  );
  const activeCar = activeTrip ? cars.find(c => c.id === activeTrip.carId) : null;

  // Filter cars based on type and search query
  const filteredCars = cars.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPlate = c.plate.toLowerCase().includes(q);
      if (!matchName && !matchPlate) return false;
    }
    return true;
  });

  const getSlotRange = () => {
    if (selectedSlot === 'morning') return { start: '08:00', end: '12:00', label: t('morning') };
    if (selectedSlot === 'afternoon') return { start: '13:00', end: '17:00', label: t('afternoon') };
    return null;
  };
  const slot = getSlotRange();

  // Timeline hours
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const startDayMin = 8 * 60; // 08:00 = 480 mins
  const totalDayMin = 10 * 60; // 10 hours

  return (
    <div className="space-y-3.5 pb-2">
      {/* 1. Active Mission Spotlight Banner */}
      {activeTrip && (
        <div className="active-mission-banner mx-3.5 sm:mx-0">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="pulse-indicator" />
              {t('active_mission')}
            </span>
            <span className="status-badge available text-[10px] font-bold">
              In Progress
            </span>
          </div>

          <div className="font-extrabold text-[15px] text-[var(--text)] mt-1.5 flex items-center gap-2">
            <span>{activeCar ? activeCar.name : 'Corporate Car'}</span>
            <span className="vehicle-plate-pill">{activeCar ? activeCar.plate : ''}</span>
          </div>

          <div className="text-[12px] text-[var(--text-secondary)] mt-1">
            <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> <strong className="text-[var(--text)]">{activeTrip.startTime} – {activeTrip.endTime}</strong> · <MapPin className="w-3.5 h-3.5 inline ml-1 mr-1 text-slate-500" /> {activeTrip.destination || 'Field mission'}
          </div>

          <div className="text-[11.5px] text-[var(--text-muted)] italic mt-1 line-clamp-1">
            &ldquo;{activeTrip.purpose}&rdquo;
          </div>

          <div className="mission-actions-row">
            <button
              type="button"
              className="btn-mission-pass"
              onClick={() => openPassModal(activeTrip.id)}
            >
              <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-300" />
              <span>{t('digital_pass')}</span>
            </button>

            <button
              type="button"
              className="btn-early-return"
              onClick={() => openEarlyReturnModal(activeTrip.id)}
            >
              <span className="btn-early-return-icon-badge">
                <RotateCcw className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="btn-early-return-text-group">
                <span className="btn-early-return-main">Return Early</span>
                <span className="btn-early-return-sub">Mark as Available</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Filter Card */}
      <div className="filter-card mx-3.5 sm:mx-0">
        <div className="filter-title-micro">Select Mission Date &amp; Slot</div>

        {/* Date Row */}
        <div className="date-row">
          <input
            type="date"
            className="ppwsa-date-input"
            value={selectedDate}
            onChange={e => {
              const val = e.target.value;
              if (val) {
                setSelectedDate(val);
                if (val !== DateUtil.todayStr() && val !== DateUtil.tomorrowStr()) {
                  setSelectedSlot('all');
                }
              }
            }}
          />
          <button
            type="button"
            className={`chip-btn ${isToday ? 'active' : ''}`}
            onClick={() => setSelectedDate(DateUtil.todayStr())}
          >
            <Calendar className="w-3.5 h-3.5 mr-1 inline" />{t('today')}
          </button>
          <button
            type="button"
            className={`chip-btn ${isTomorrow ? 'active' : ''}`}
            onClick={() => setSelectedDate(DateUtil.tomorrowStr())}
          >
            <Calendar className="w-3.5 h-3.5 mr-1 inline" />{t('tomorrow')}
          </button>
        </div>

        {/* Slot Pills (Strictly Today or Tomorrow) */}
        {(isToday || isTomorrow) && (
          <div className="slot-row">
            <button
              type="button"
              className={`slot-pill ${selectedSlot === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedSlot('all')}
            >
              {t('all_day')}
            </button>
            <button
              type="button"
              className={`slot-pill ${selectedSlot === 'morning' ? 'active' : ''}`}
              onClick={() => setSelectedSlot('morning')}
            >
              {t('morning')}
            </button>
            <button
              type="button"
              className={`slot-pill ${selectedSlot === 'afternoon' ? 'active' : ''}`}
              onClick={() => setSelectedSlot('afternoon')}
            >
              {t('afternoon')}
            </button>
          </div>
        )}

        {/* Vehicle Type Chips */}
        <div className="scroll-chips-row">
          <button
            type="button"
            className={`chip-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            {t('all_types')}
          </button>
          {(['Sedan', 'SUV', 'Van', 'Pickup'] as CarType[]).map(type => (
            <button
              key={type}
              type="button"
              className={`chip-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="search-input-wrap">
          <Search className="search-icon-svg w-4 h-4" />
          <input
            type="text"
            className="ppwsa-search-field"
            placeholder={t('search_hint')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3. View Mode Switcher Row */}
      <div className="view-switch-row px-3.5 sm:px-0">
        <div className="view-switch-title">
          <div className="view-switch-stripe" />
          <span>Fleet Schedule</span>
        </div>

        <div className="view-switch-capsule">
          <button
            type="button"
            className={`view-switch-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('view_cards')}</span>
          </button>
          <button
            type="button"
            className={`view-switch-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('view_timeline')}</span>
          </button>
        </div>
      </div>

      {/* 4. Main Body: Cards View OR Timeline View */}
      {viewMode === 'cards' ? (
        <div className="cards-stack px-3.5 sm:px-0">
          {!filteredCars.length ? (
            <div className="text-center py-10 px-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] text-[var(--text-secondary)]">
              <p className="font-bold text-sm text-[var(--text)]">No vehicles match your filter</p>
              <p className="text-xs mt-1 text-[var(--text-muted)]">
                Try changing date, slot, or clear search criteria.
              </p>
            </div>
          ) : (
            filteredCars.map(car => {
              const isMaint = isCarInMaintenance(car, selectedDate);
              const dayApproved = bookings.filter(
                b =>
                  b.carId === car.id &&
                  b.startDate === selectedDate &&
                  (b.status === 'Approved' || (b.status === 'Completed' && b.returnedEarly))
              );
              const activeApproved = dayApproved.filter(b => b.status === 'Approved');
              const earlyReturned = dayApproved.filter(b => b.status === 'Completed' && b.returnedEarly);

              let isBookedInSlot = false;
              let hasRemainingSlot = false;
              let remainingStartTime = '10:00';

              if (slot) {
                isBookedInSlot = dayApproved.some(b => DateUtil.isOverlap(slot.start, slot.end, b.startTime, b.endTime));
                if (isBookedInSlot && !activeApproved.length && earlyReturned.length) {
                  const latestEnd = earlyReturned[earlyReturned.length - 1].endTime;
                  if (DateUtil.toMins(latestEnd) < DateUtil.toMins(slot.end)) {
                    hasRemainingSlot = true;
                    remainingStartTime = latestEnd;
                  }
                }
              } else {
                isBookedInSlot = activeApproved.length > 0;
              }

              let canBook = true;
              let btnText = t('book_car');
              let prefillStart = slot ? slot.start : '09:00';
              let prefillEnd = slot ? slot.end : '12:00';

              if (isMaint) {
                canBook = false;
                btnText = t('under_maint');
              } else if (hasRemainingSlot) {
                canBook = true;
                const slotEnd = slot ? slot.end : '17:00';
                btnText = `Book ${remainingStartTime}–${slotEnd} (Open)`;
                prefillStart = remainingStartTime;
                prefillEnd = slotEnd;
              } else if (isBookedInSlot) {
                if (slot) {
                  canBook = false;
                  btnText = `Unavailable for ${selectedSlot === 'morning' ? 'Morning' : 'Afternoon'}`;
                } else {
                  btnText = 'Book open hours';
                }
              } else if (!activeApproved.length && earlyReturned.length) {
                const latestEnd = earlyReturned[earlyReturned.length - 1].endTime;
                btnText = `Book from ${latestEnd} onward`;
                prefillStart = latestEnd;
                prefillEnd = '17:00';
              } else {
                btnText = slot ? `Book ${slot.label}` : t('book_car');
              }

              return (
                <div
                  key={car.id}
                  className="vehicle-card cursor-pointer hover:border-purple-400/50 transition-all"
                  onClick={e => {
                    if (!(e.target as HTMLElement).closest('button')) {
                      openBookingModal(car.id, prefillStart, prefillEnd);
                    }
                  }}
                  title={`Click vehicle to book ${car.name}`}
                >
                  <div className="vehicle-card-header">
                    <div>
                      <div className="vehicle-title">{car.name}</div>
                      <span className="vehicle-plate-pill">{car.plate}</span>
                    </div>

                    <div>
                      {isMaint ? (
                        <span className="status-badge maintenance">
                          {car.maintenance?.mode === 'scheduled' ? 'Scheduled Service' : t('maintenance')}
                        </span>
                      ) : hasRemainingSlot ? (
                        <span className="status-badge available" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }}>
                          Open {remainingStartTime}–{slot?.end} 
                        </span>
                      ) : isBookedInSlot ? (
                        <span className="status-badge booked">{t('booked')}</span>
                      ) : !activeApproved.length && earlyReturned.length ? (
                        <span className="status-badge available" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }}>
                          Available from {earlyReturned[earlyReturned.length - 1].endTime} 
                        </span>
                      ) : (
                        <span className="status-badge available">{t('available')}</span>
                      )}
                    </div>
                  </div>

                  <div className="vehicle-body-layout">
                    <div className="vehicle-illustration-box">
                      <CarIllustration type={car.type} />
                    </div>
                    <div className="flex-1">
                      <div className="car-specs-grid">
                        <span className="spec-tag"><User className="w-3 h-3 text-violet-600" /> {car.seats} Seats</span>
                        <span className="spec-tag"><Zap className="w-3 h-3 text-violet-600" /> Auto</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        Corporate Standard · A/C · GPS Ready
                      </div>
                    </div>
                  </div>

                  {/* Mini Day Schedule Visualizer (08:00 - 17:00) */}
                  <div className="mini-schedule-strip">
                    <div className="mini-schedule-header">
                      <span>Day Schedule</span>
                      <span>08:00 – 17:00</span>
                    </div>
                    <div className="mini-schedule-bar">
                      {[8, 9, 10, 11, 12, 13, 14, 15, 16].map(h => {
                        const hStart = `${String(h).padStart(2, '0')}:00`;
                        const hEnd = `${String(h + 1).padStart(2, '0')}:00`;
                        let segClass = 'free';
                        if (isMaint) {
                          segClass = 'maint';
                        } else if (dayApproved.some(b => DateUtil.isOverlap(hStart, hEnd, b.startTime, b.endTime))) {
                          segClass = 'busy';
                        }
                        return (
                          <div
                            key={h}
                            className={`mini-slot-seg ${segClass}`}
                            title={`${hStart}–${hEnd}: ${segClass}`}
                          />
                        );
                      })}
                    </div>
                    <div className="mini-schedule-labels">
                      <span>08:00</span>
                      <span>12:00</span>
                      <span>17:00</span>
                    </div>
                  </div>

                  {/* Reserved Slots notice box */}
                  {isMaint ? (
                    <div className="slot-notice-box busy flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{car.maintenance?.reason ? `Vehicle under service: ${car.maintenance.reason}` : 'Vehicle scheduled for service'}</span>
                    </div>
                  ) : hasRemainingSlot || (!activeApproved.length && earlyReturned.length) ? (
                    <div className="slot-notice-box open" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }}>
                      <strong>Schedule on {selectedDate}:</strong>
                      {dayApproved.map(b => {
                        const u = users.find(x => x.id === b.requesterId);
                        return (
                          <div key={b.id} className="mt-0.5 text-xs">
                            • <strong>{b.startTime}–{b.endTime}</strong> by {u ? u.name : 'Staff'}{' '}
                            <span className="font-bold text-emerald-600">
                              (Returned early at {b.endTime} · Available from {b.endTime} onward! )
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : isBookedInSlot ? (
                    <div className="slot-notice-box busy">
                      <strong>Reserved on {selectedDate}:</strong>
                      {dayApproved.map(b => {
                        const u = users.find(x => x.id === b.requesterId);
                        if (b.returnedEarly) {
                          return (
                            <div key={b.id} className="mt-0.5 text-xs">
                              • <strong>{b.startTime}–{b.endTime}</strong> by {u ? u.name : 'Staff'}{' '}
                              <span className="font-bold text-emerald-600">
                                (Returned early at {b.endTime} · Available now! )
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={b.id} className="mt-0.5 text-xs">
                            • {b.startTime}–{b.endTime} by {u ? u.name : 'Staff'} (&ldquo;{b.purpose}&rdquo;)
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="slot-notice-box open flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('full_open')} on {selectedDate}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-ppwsa-primary mt-2"
                    disabled={!canBook}
                    onClick={() => openBookingModal(car.id, prefillStart, prefillEnd)}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{btnText}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* 5. Hourly Timeline View */
        <div className="timeline-card-box mx-3.5 sm:mx-0">
          <div className="timeline-legend">
            <span className="legend-item">
              <span className="legend-dot avail" />
              <span>Available (Tap)</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot approved" />
              <span>Approved</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot early-returned" />
              <span>Returned Early (Open)</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot pending" />
              <span>Pending</span>
            </span>
            <span className="legend-item text-[10.5px] text-[var(--text-muted)] ml-auto">
              <ArrowRight className="w-3.5 h-3.5 inline mr-1" />Swipe across hours
            </span>
          </div>

          <div className="timeline-scroll-container">
            <table className="timeline-table">
              <thead>
                <tr>
                  <th className="sticky-col">Vehicle</th>
                  {hours.map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(car => {
                  const isMaint = isCarInMaintenance(car, selectedDate);
                  const dayBookings = bookings.filter(
                    b =>
                      b.carId === car.id &&
                      b.startDate === selectedDate &&
                      (b.status === 'Approved' || b.status === 'Pending' || (b.status === 'Completed' && b.returnedEarly))
                  );

                  return (
                    <tr key={car.id}>
                      <td
                        className="sticky-col cursor-pointer"
                        title={isMaint ? 'Under service' : `Click to book ${car.name}`}
                        onClick={() => {
                          if (isMaint) {
                            showToast(`${car.name} is currently under service.`, 'info');
                          } else {
                            openBookingModal(car.id, '09:00', '12:00');
                          }
                        }}
                      >
                        <div className="font-extrabold text-[12px] text-[var(--text)] whitespace-nowrap overflow-hidden text-ellipsis">
                          {car.name.split(' ')[0]} {car.name.split(' ')[1] || ''}
                        </div>
                        <span className="vehicle-plate-pill text-[10px] py-0.5 px-1.5 mt-1 inline-block">
                          {car.plate}
                        </span>
                      </td>

                      <td colSpan={10}>
                        <div className="timeline-track-wrap">
                          {isMaint ? (
                            <div className="w-full h-full bg-[var(--card-alt)] flex items-center justify-center text-[var(--text-muted)] text-[11px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />Service / Maintenance
                            </div>
                          ) : (
                            <>
                              {/* Interactive 1-hour Slot Columns */}
                              {hours.map((h, i) => {
                                const nextHour = `${String(8 + i + 1).padStart(2, '0')}:00`;
                                return (
                                  <div
                                    key={h}
                                    className="timeline-hour-slot"
                                    title={`Tap to book ${car.name} at ${h}`}
                                    onClick={() => openBookingModal(car.id, h, nextHour)}
                                  />
                                );
                              })}

                              {/* Overlay Event Bars */}
                              {dayBookings.map(b => {
                                const bStart = Math.max(startDayMin, DateUtil.toMins(b.startTime));
                                const bEnd = Math.min(startDayMin + totalDayMin, DateUtil.toMins(b.endTime));
                                const leftPct = ((bStart - startDayMin) / totalDayMin) * 100;
                                const widthPct = Math.max(7, ((bEnd - bStart) / totalDayMin) * 100);

                                const isEarly = b.returnedEarly;
                                const statusCls = isEarly ? 'early-returned' : b.status.toLowerCase();
                                const reqUser = users.find(u => u.id === b.requesterId);
                                const label = isEarly
                                  ? `${b.startTime}–${b.endTime}: Returned Early by ${reqUser ? reqUser.name : 'Staff'} (Available from ${b.endTime} onward)`
                                  : `${b.startTime}–${b.endTime}: ${reqUser ? reqUser.name : 'Staff'} ("${b.purpose}")`;

                                return (
                                  <div
                                    key={b.id}
                                    className={`timeline-event-bar ${statusCls}`}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                    title={label}
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (b.status === 'Approved') {
                                        openPassModal(b.id);
                                      } else if (isEarly) {
                                        showToast(`${car.name} returned early at ${b.endTime}. Available for colleagues!`, 'success');
                                      } else {
                                        showToast(`Booking ${b.id} is ${b.status} ("${b.purpose}")`, 'info');
                                      }
                                    }}
                                  >
                                    <span className="truncate">
                                      {b.startTime}–{b.endTime} · {reqUser ? reqUser.name.split(' ')[0] : 'Staff'}
                                      {isEarly ? ' (Returned)' : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

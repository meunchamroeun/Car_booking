'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import {
  Plus,
  Ticket,
  RotateCcw,
  MapPin,
  Car as CarIcon,
  XCircle,
  Clock,
  CheckCircle2,
  User as UserIcon,
} from 'lucide-react';

export function MyBookingsView() {
  const {
    currentUser,
    bookings,
    cars,
    drivers,
    myTripsFilter,
    setMyTripsFilter,
    setCurrentTab,
    openPassModal,
    openEarlyReturnModal,
    cancelBooking,
    t,
  } = useApp();

  const myBookings = bookings
    .filter(b => b.requesterId === currentUser.id)
    .filter(b => myTripsFilter === 'all' || b.status.toLowerCase() === myTripsFilter.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-3 pb-2 px-3.5 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-center py-1">
        <div>
          <h2 className="text-[16px] font-extrabold text-[var(--text)] tracking-tight">
            {t('my_bookings_title')}
          </h2>
          <p className="text-[11.5px] text-[var(--text-secondary)]">
            {t('my_bookings_desc')}
          </p>
        </div>
        <button
          type="button"
          className="chip-btn active text-[11px] h-8.5 px-3 flex items-center gap-1.5"
          onClick={() => setCurrentTab('cars')}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="scroll-chips-row mb-3">
        <button
          type="button"
          className={`chip-btn ${myTripsFilter === 'all' ? 'active' : ''}`}
          onClick={() => setMyTripsFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`chip-btn ${myTripsFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setMyTripsFilter('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          className={`chip-btn ${myTripsFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setMyTripsFilter('approved')}
        >
          Approved
        </button>
        <button
          type="button"
          className={`chip-btn ${myTripsFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setMyTripsFilter('completed')}
        >
          Completed
        </button>
        <button
          type="button"
          className={`chip-btn ${myTripsFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setMyTripsFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {/* Bookings Stack */}
      <div className="cards-stack">
        {!myBookings.length ? (
          <div className="text-center py-12 px-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] text-[var(--text-secondary)]">
            <Clock className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
            <p className="font-bold text-sm text-[var(--text)]">No bookings found</p>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              You have no vehicle reservations under this status filter.
            </p>
          </div>
        ) : (
          myBookings.map(b => {
            const car = cars.find(c => c.id === b.carId);
            const driver = b.driverId ? drivers.find(d => d.id === b.driverId) : null;
            const statusClass = b.status.toLowerCase();

            return (
              <div key={b.id} className="vehicle-card space-y-2.5">
                {/* Header */}
                <div className="vehicle-card-header">
                  <div>
                    <span className="text-[11px] font-extrabold text-[var(--c-primary)] font-mono">
                      {b.id}
                    </span>
                    <div className="text-[14px] font-extrabold text-[var(--text)] mt-0.5">
                      {b.startDate}
                    </div>
                    <div className="text-[11.5px] text-[var(--text-secondary)]">
                      {b.startTime} – {b.endTime}
                    </div>
                  </div>
                  <div>
                    <span className={`status-badge ${statusClass}`}>{b.status}</span>
                  </div>
                </div>

                {/* Car Roster Line */}
                <div className="flex items-center gap-2 font-bold text-[13px] text-[var(--text)]">
                  <CarIcon className="w-4 h-4 text-[var(--c-primary)] shrink-0" />
                  <span>
                    {car ? car.name : 'Corporate Car'} ({car ? car.plate : '—'})
                  </span>
                </div>

                {/* Purpose & Destination */}
                <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
                  <div>&ldquo;{b.purpose}&rdquo;</div>
                  {b.destination && (
                    <div className="text-[11px] font-medium text-[var(--c-primary)] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{b.destination}</span>
                    </div>
                  )}
                </div>

                {/* Driver & Passenger Metadata */}
                <div className="text-[11.5px] text-[var(--text-muted)] flex justify-between items-center">
                  <span>
                    Driver:{' '}
                    {b.needDriver ? (
                      driver ? (
                        <strong className="text-[var(--text)]">
                          {driver.name} ({driver.phone})
                        </strong>
                      ) : (
                        <em className="text-amber-600 dark:text-amber-400">Allocating...</em>
                      )
                    ) : (
                      'Self-drive'
                    )}
                  </span>
                  <span>{b.passengers || 1} Pax</span>
                </div>

                {/* Early Return Notice Box */}
                {b.returnedEarly && (
                  <div className="text-[11.5px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1">
                    <div className="font-extrabold flex justify-between items-center">
                      <span><CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />Returned Early at {b.actualEndTime || b.endTime}</span>
                      <span className="text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded">
                        Released
                      </span>
                    </div>
                    <div className="text-[11px] leading-relaxed opacity-90">
                      Scheduled: {b.startTime}–{b.originalEndTime || '12:00'}. Vehicle slot released from {b.actualEndTime || b.endTime} onward for other staff to book.
                    </div>
                    {b.endOdometer && (
                      <div className="text-[10.5px] text-[var(--text-muted)] mt-1">
                        Ending Odometer: {b.endOdometer} km
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Note */}
                {b.rejectReason && (
                  <div className="text-[11.5px] text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-300 dark:border-rose-800">
                    <strong>Rejection Note:</strong> &ldquo;{b.rejectReason}&rdquo;
                  </div>
                )}

                {/* Actions */}
                <div className="pt-1 flex flex-col gap-2">
                  {b.status === 'Approved' && (
                    <div className="mission-actions-row">
                      <button
                        type="button"
                        className="btn-mission-pass"
                        onClick={() => openPassModal(b.id)}
                      >
                        <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        <span>{t('digital_pass')}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-early-return"
                        onClick={() => openEarlyReturnModal(b.id)}
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
                  )}

                  {b.status === 'Completed' && (
                    <button
                      type="button"
                      className="chip-btn w-full h-8.5 text-xs text-[var(--text)] justify-center"
                      onClick={() => openPassModal(b.id)}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Pass &amp; Mission Details</span>
                    </button>
                  )}

                  {(b.status === 'Pending' || b.status === 'Approved') && (
                    <button
                      type="button"
                      className="chip-btn w-full h-8 text-[11px] text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900 justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        if (confirm(`Are you sure you want to cancel booking request ${b.id}?`)) {
                          cancelBooking(b.id);
                        }
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Booking</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

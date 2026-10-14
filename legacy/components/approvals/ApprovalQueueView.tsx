'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Car as CarIcon,
  Clock,
  MapPin,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export function ApprovalQueueView() {
  const {
    currentUser,
    users,
    cars,
    drivers,
    bookings,
    approvalsFilter,
    setApprovalsFilter,
    switchUser,
    openReviewModal,
    openRejectModal,
    setDriverSelectedId,
    setDriverTasksFilter,
    setCurrentTab,
    checkCarConflict,
    t,
  } = useApp();

  const isApprover = currentUser.role === 'Approver' || currentUser.role === 'Admin';

  if (!isApprover) {
    return (
      <div className="mx-3.5 sm:mx-0 my-5 text-center p-8 bg-[var(--card)] rounded-2xl border border-[var(--border)] space-y-3">
        <ShieldCheck className="w-12 h-12 text-[var(--c-primary)] mx-auto opacity-80" />
        <h3 className="font-extrabold text-[16px] text-[var(--text)]">Approver Access Only</h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
          You are currently logged in as an Employee ({currentUser.name}). Switch to an Approver role to test review &amp; driver assignment.
        </p>
        <button
          type="button"
          className="btn-ppwsa-primary max-w-xs mx-auto mt-2"
          onClick={() => switchUser('u4')}
        >
          <span>Switch to Sophea Lim (Approver)</span>
        </button>
      </div>
    );
  }

  const filtered = bookings
    .filter(b => approvalsFilter === 'all' || b.status.toLowerCase() === approvalsFilter.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const pendingCount = bookings.filter(b => b.status === 'Pending').length;

  return (
    <div className="space-y-3 pb-2 px-3.5 sm:px-0">
      {/* Header */}
      <div className="py-1">
        <h2 className="text-[16px] font-extrabold text-[var(--text)] tracking-tight">
          {t('approval_queue')}
        </h2>
        <p className="text-[11.5px] text-[var(--text-secondary)]">
          {pendingCount} request(s) awaiting your decision
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="scroll-chips-row mb-3">
        <button
          type="button"
          className={`chip-btn ${approvalsFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setApprovalsFilter('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          className={`chip-btn ${approvalsFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setApprovalsFilter('approved')}
        >
          Approved
        </button>
        <button
          type="button"
          className={`chip-btn ${approvalsFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setApprovalsFilter('rejected')}
        >
          Rejected
        </button>
        <button
          type="button"
          className={`chip-btn ${approvalsFilter === 'all' ? 'active' : ''}`}
          onClick={() => setApprovalsFilter('all')}
        >
          All
        </button>
      </div>

      {/* Roster Cards */}
      <div className="cards-stack">
        {!filtered.length ? (
          <div className="text-center py-12 px-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] text-[var(--text-secondary)]">
            <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-sm text-[var(--text)]">No requests in this queue</p>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              All caught up! No requests currently awaiting action under this filter.
            </p>
          </div>
        ) : (
          filtered.map(b => {
            const car = cars.find(c => c.id === b.carId);
            const requester = users.find(x => x.id === b.requesterId);
            const driver = b.driverId ? drivers.find(d => d.id === b.driverId) : null;
            const statusClass = b.status.toLowerCase();
            const conflict = b.status === 'Pending' ? checkCarConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id) : null;

            return (
              <div key={b.id} className="vehicle-card space-y-2.5">
                <div className="vehicle-card-header">
                  <div>
                    <div className="font-extrabold text-[14px] text-[var(--text)]">
                      {requester ? requester.name : 'Staff'} ({requester ? requester.dept : ''})
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-extrabold text-[var(--c-primary)] font-mono">{b.id}</span>
                      <span className="text-[10.5px] text-[var(--text-muted)]">Requested {b.createdAt}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`status-badge ${statusClass}`}>{b.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-[13px] text-[var(--text)]">
                  <CarIcon className="w-4 h-4 text-[var(--c-primary)] shrink-0" />
                  <span>
                    {car ? car.name : 'Car'} ({car ? car.plate : '—'})
                  </span>
                </div>

                <div className="text-[12px] text-[var(--text-secondary)]">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />Schedule: <strong>{b.startDate}</strong> · {b.startTime} – {b.endTime}
                </div>

                <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
                  <div>&ldquo;{b.purpose}&rdquo;</div>
                  {b.destination && (
                    <div className="text-[11px] font-medium text-[var(--c-primary)]"><MapPin className="w-3.5 h-3.5 inline mr-1 text-violet-600" />{b.destination}</div>
                  )}
                </div>

                <div className="text-[11.5px] text-[var(--text-muted)] flex justify-between">
                  <span>
                    Driver Option:{' '}
                    {b.needDriver ? (
                      <strong className="text-amber-600 dark:text-amber-400">Driver Requested</strong>
                    ) : (
                      'Self-drive'
                    )}
                  </span>
                  <span>{b.passengers || 1} Passenger(s)</span>
                </div>

                {/* Conflict warning */}
                {conflict?.isConflict && (
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-2.5 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Double-booking warning: Overlapping booking exists for this vehicle.</span>
                  </div>
                )}

                {/* Actions */}
                {b.status === 'Pending' ? (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="chip-btn flex-1 h-9.5 text-xs text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900 justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => openRejectModal(b.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      className="btn-ppwsa-primary flex-1 h-9.5 text-xs"
                      onClick={() => openReviewModal(b.id)}
                    >
                      <Check className="w-4 h-4" />
                      <span>Review &amp; Approve</span>
                    </button>
                  </div>
                ) : driver ? (
                  <div className="flex justify-between items-center bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border-subtle)] mt-1">
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] font-extrabold uppercase">
                        Driver Dispatch
                      </div>
                      <div className="text-[12px] font-bold text-[var(--text)] mt-0.5 flex items-center gap-2">
                        <span>{driver.name}</span>
                        <span className="status-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {b.taskStatus || 'Assigned'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="chip-btn active text-[11px] h-7 px-2.5 flex items-center gap-1"
                      onClick={() => {
                        const driverUser = users.find(u => u.driverId === b.driverId);
                        if (driverUser) switchUser(driverUser.id);
                        setDriverSelectedId(b.driverId || 'all');
                        setDriverTasksFilter('all');
                        setCurrentTab('driver');
                      }}
                    >
                      <span>Driver Task</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

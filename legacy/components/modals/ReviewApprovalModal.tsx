'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';

export function ReviewApprovalModal() {
  const {
    reviewModalOpen,
    reviewBookingId,
    closeReviewModal,
    openRejectModal,
    approveBooking,
    bookings,
    cars,
    users,
    drivers,
    checkCarConflict,
    showToast,
  } = useApp();

  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const b = bookings.find(x => x.id === reviewBookingId);
  const car = b ? cars.find(c => c.id === b.carId) : null;
  const reqUser = b ? users.find(u => u.id === b.requesterId) : null;

  useEffect(() => {
    if (b) {
      setSelectedDriverId(b.driverId || '');
    }
  }, [b]);

  if (!reviewModalOpen || !b) return null;

  const conflict = checkCarConflict(b.carId, b.startDate, b.startTime, b.endTime, b.id);

  const handleApprove = () => {
    if (conflict.isConflict) {
      showToast(conflict.reason || 'Cannot approve conflicting booking.', 'error');
      return;
    }
    if (b.needDriver && !selectedDriverId) {
      showToast('Please assign an available company driver.', 'error');
      return;
    }
    approveBooking(b.id, selectedDriverId || null);
  };

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeReviewModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeReviewModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">Review Booking Request</div>
          <button type="button" className="sheet-close-round" onClick={closeReviewModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="sheet-scroll-body space-y-3">
          {/* Summary Card */}
          <div className="bg-[var(--card-alt)] border border-[var(--border)] rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <strong className="text-[var(--c-primary)] font-mono text-[13px]">{b.id}</strong>
              <span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span>
            </div>
            <div className="font-extrabold text-[14.5px] text-[var(--text)]">
              {reqUser ? reqUser.name : 'Staff'} ({reqUser ? reqUser.dept : ''})
            </div>
            <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
              <div>Vehicle: <strong>{car ? car.name : ''}</strong> ({car ? car.plate : ''})</div>
              <div>Schedule: <strong>{b.startDate}</strong> · {b.startTime} – {b.endTime}</div>
            </div>

            <div className="text-xs text-[var(--text)] bg-[var(--card)] p-2.5 rounded-xl border border-[var(--border-subtle)] mt-1">
              &ldquo;{b.purpose}&rdquo;
              {b.destination && (
                <div className="text-[11px] font-medium text-[var(--c-primary)] mt-1">
                  {b.destination}
                </div>
              )}
            </div>
          </div>

          {/* Double booking conflict warning */}
          {conflict.isConflict && (
            <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 p-3 rounded-2xl text-xs border border-rose-300 dark:border-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Double-booking warning:</strong> {conflict.reason || 'This vehicle already has an approved booking for overlapping hours.'}
              </span>
            </div>
          )}

          {/* Driver allocation selector if needed */}
          {b.needDriver && (
            <div className="form-group-block bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-300 dark:border-amber-800 space-y-1">
              <label className="form-label-bold text-amber-900 dark:text-amber-300">
                <span>Assign Company Driver</span>
                <span className="req-mark">* Required</span>
              </label>
              <select
                className="ppwsa-input bg-white dark:bg-slate-900 font-medium"
                value={selectedDriverId}
                onChange={e => setSelectedDriverId(e.target.value)}
              >
                <option value="">-- Choose an available driver --</option>
                {drivers.map(d => {
                  const isBusy = bookings.some(
                    bk =>
                      bk.id !== b.id &&
                      bk.driverId === d.id &&
                      bk.startDate === b.startDate &&
                      bk.status === 'Approved' &&
                      DateUtil.isOverlap(b.startTime, b.endTime, bk.startTime, bk.endTime)
                  );
                  return (
                    <option key={d.id} value={d.id} disabled={isBusy}>
                      {d.name} ({d.phone}) {isBusy ? '— BUSY' : '— Available'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="chip-btn flex-1 h-10.5 text-xs text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900 justify-center hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={() => {
                closeReviewModal();
                openRejectModal(b.id);
              }}
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Request</span>
            </button>
            <button
              type="button"
              className="btn-ppwsa-primary flex-1 h-10.5 text-xs font-bold"
              disabled={conflict.isConflict}
              onClick={handleApprove}
            >
              <Check className="w-4 h-4" />
              <span>Approve Booking</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

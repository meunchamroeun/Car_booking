'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { X,  RotateCcw, Check, Sparkles, AlertCircle  } from 'lucide-react';

export function EarlyReturnModal() {
  const {
    earlyReturnModalOpen,
    earlyReturnBookingId,
    closeEarlyReturnModal,
    bookings,
    cars,
    users,
    earlyReturnBooking,
    showToast,
  } = useApp();

  const [returnTime, setReturnTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');

  const b = bookings.find(x => x.id === earlyReturnBookingId);
  const car = b ? cars.find(c => c.id === b.carId) : null;
  const req = b ? users.find(u => u.id === b.requesterId) : null;

  useEffect(() => {
    if (b) {
      const now = new Date();
      const nowH = DateUtil.pad(now.getHours());
      const nowM = DateUtil.pad(now.getMinutes());
      const nowStr = `${nowH}:${nowM}`;

      const startMins = DateUtil.toMins(b.startTime);
      const endMins = DateUtil.toMins(b.originalEndTime || b.endTime);
      const nowMins = DateUtil.toMins(nowStr);

      if (nowMins > startMins && nowMins < endMins) {
        setReturnTime(nowStr);
      } else if (startMins <= 480 && endMins >= 720) {
        setReturnTime('10:00');
      } else {
        const mid = Math.round((startMins + endMins) / 2 / 15) * 15;
        setReturnTime(`${DateUtil.pad(Math.floor(mid / 60))}:${DateUtil.pad(mid % 60)}`);
      }
      setNotes('');
    }
  }, [b]);

  if (!earlyReturnModalOpen || !b) return null;

  const origEnd = b.originalEndTime || b.endTime;
  const startMins = DateUtil.toMins(b.startTime);
  const endMins = DateUtil.toMins(origEnd);
  const returnMins = DateUtil.toMins(returnTime);

  const isValidReturn = returnTime && returnMins > startMins;
  const isEarly = returnMins < endMins;
  const savedMins = Math.max(0, endMins - returnMins);
  const savedHours = (savedMins / 60).toFixed(savedMins % 60 === 0 ? 0 : 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidReturn) {
      showToast(`Return time must be after mission start time (${b.startTime})`, 'error');
      return;
    }
    earlyReturnBooking(b.id, returnTime, notes);
  };

  const now = new Date();
  const currentNowStr = `${DateUtil.pad(now.getHours())}:${DateUtil.pad(now.getMinutes())}`;

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeEarlyReturnModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeEarlyReturnModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">Return Vehicle Early &amp; Release Slot</div>
          <button type="button" className="sheet-close-round" onClick={closeEarlyReturnModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sheet-scroll-body">
          {/* Vehicle & Booking Summary Box */}
          <div className="bg-[var(--card-alt)] border border-[var(--border)] rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-extrabold text-[14.5px] text-[var(--text)]">
                  {car ? car.name : 'Vehicle'}
                </div>
                <span className="vehicle-plate-pill mt-1 inline-block">
                  {car ? car.plate : ''} · {car ? car.type : ''}
                </span>
              </div>
              <span className="status-badge available" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#dbeafe' }}>
                {b.status}
              </span>
            </div>

            <div className="text-[12px] text-[var(--text-secondary)] space-y-1 border-t border-dashed border-[var(--border)] pt-2 mt-2 leading-relaxed">
              <div><strong>Passenger:</strong> {req ? req.name : 'Staff'} ({req ? req.dept : ''})</div>
              <div><strong>Date:</strong> {b.startDate}</div>
              <div>
                <strong>Scheduled Window:</strong> <span className="font-bold text-[var(--text)]">{b.startTime} – {origEnd}</span>
              </div>
              <div><strong>Destination:</strong> {b.destination || 'Mission location'}</div>
              <div><strong>Purpose:</strong> &ldquo;{b.purpose}&rdquo;</div>
            </div>
          </div>

          {/* Return Time Selection */}
          <div className="form-group-block">
            <label className="form-label-bold flex justify-between">
              <span>Actual Return Time</span>
              <span className="text-[11px] font-semibold text-[var(--c-primary)]">
                Scheduled until {origEnd}
              </span>
            </label>
            <input
              type="time"
              className="ppwsa-input font-bold tracking-wider text-[15px]"
              step={300}
              value={returnTime}
              onChange={e => setReturnTime(e.target.value)}
            />
          </div>

          {/* Quick Preset Chips */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              className="chip-btn text-[11px] h-7.5 px-3"
              onClick={() => setReturnTime('10:00')}
            >
              10:00 AM (Early Return)
            </button>
            <button
              type="button"
              className="chip-btn text-[11px] h-7.5 px-3"
              onClick={() => setReturnTime('10:30')}
            >
              10:30 AM
            </button>
            <button
              type="button"
              className="chip-btn text-[11px] h-7.5 px-3"
              onClick={() => setReturnTime('11:00')}
            >
              11:00 AM
            </button>
            <button
              type="button"
              className="chip-btn text-[11px] h-7.5 px-3"
              onClick={() => setReturnTime(currentNowStr)}
            >
              Current Time ({currentNowStr})
            </button>
          </div>

          {/* Dynamic Release Benefit Preview */}
          {!isValidReturn ? (
            <div className="text-[11.5px] text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Return time must be after mission start time ({b.startTime}).</span>
            </div>
          ) : isEarly ? (
            <div className="text-[12px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-[1.5px] border-emerald-400 dark:border-emerald-700 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 font-extrabold text-[13px]">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Early Return Benefit:</span>
                <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-[11px] px-2 py-0.5 rounded-full">
                  +{savedHours} Hour(s) Released
                </span>
              </div>
              <div className="leading-relaxed opacity-95">
                Returning at <strong>{returnTime}</strong> frees up the{' '}
                <strong>{returnTime} – {origEnd}</strong> slot for other staff!
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Vehicle will immediately become available in the catalog &amp; timeline starting from {returnTime}.
                </span>
              </div>
            </div>
          ) : returnMins === endMins ? (
            <div className="text-[11.5px] text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-xl p-3">
              Returned on schedule at {returnTime}. Mission will be marked as Completed.
            </div>
          ) : (
            <div className="text-[11.5px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3">
              Returned after scheduled end time ({origEnd}). Booking end time will be adjusted to {returnTime}.
            </div>
          )}

          {/* Completion Notes */}
          <div className="form-group-block">
            <label className="form-label-bold">
              <span>Completion Notes</span>
              <span className="text-[11px] text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <textarea
              className="ppwsa-textarea"
              rows={2}
              placeholder="e.g. Mission completed early. Vehicle clean and key returned."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={!isValidReturn}
              className="btn-early-return w-full h-12 justify-center gap-2 rounded-full font-extrabold text-sm shadow-md"
            >
              <span className="btn-early-return-icon-badge w-6.5 h-6.5">
                <RotateCcw className="w-3.5 h-3.5" />
              </span>
              <span>Make Available from {returnTime}</span>
            </button>

            <button
              type="button"
              className="btn-form-cancel"
              onClick={closeEarlyReturnModal}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

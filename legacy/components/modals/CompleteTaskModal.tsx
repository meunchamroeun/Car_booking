'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import { X,  CheckCircle2, Clock  } from 'lucide-react';

export function CompleteTaskModal() {
  const {
    completeTaskModalOpen,
    completeTaskBookingId,
    closeCompleteTaskModal,
    bookings,
    cars,
    users,
    completeDriverMission,
    showToast,
  } = useApp();

  const [returnTime, setReturnTime] = useState<string>('');
  const [odometer, setOdometer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const b = bookings.find(x => x.id === completeTaskBookingId);
  const car = b ? cars.find(c => c.id === b.carId) : null;
  const req = b ? users.find(u => u.id === b.requesterId) : null;

  useEffect(() => {
    if (b) {
      setReturnTime(DateUtil.nowTimeStr());
      setOdometer('');
      setNotes('');
    }
  }, [b]);

  if (!completeTaskModalOpen || !b) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTime) {
      showToast('Please specify a return time', 'error');
      return;
    }
    completeDriverMission(b.id, returnTime, odometer.trim(), notes.trim());
  };

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeCompleteTaskModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeCompleteTaskModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">Complete Driving Mission</div>
          <button type="button" className="sheet-close-round" onClick={closeCompleteTaskModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sheet-scroll-body">
          {/* Mission Details Box */}
          <div className="bg-[var(--card-alt)] border border-[var(--border)] rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-[13.5px] text-[var(--text)]">
                {b.id} · Driving Mission
              </span>
              <span className="status-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}>
                {b.taskStatus || 'Assigned'}
              </span>
            </div>

            <div className="text-[12px] text-[var(--text-secondary)] space-y-1 border-t border-[var(--border-subtle)] pt-2 leading-relaxed">
              <div><strong>Passenger:</strong> {req ? req.name : 'Staff'} ({req ? req.dept : ''})</div>
              <div><strong>Destination:</strong> {b.destination || 'Field site destination'}</div>
              <div><strong>Vehicle:</strong> {car ? car.name : ''} ({car ? car.plate : ''})</div>
              <div><strong>Schedule:</strong> {b.startDate} · {b.startTime} – {b.originalEndTime || b.endTime}</div>
            </div>
          </div>

          {/* Actual Completion Time */}
          <div className="form-group-block">
            <label className="form-label-bold flex items-center justify-between">
              <span>Actual Completion / Return Time</span>
              <span className="text-[11px] text-[var(--text-muted)] font-normal flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Scheduled until {b.originalEndTime || b.endTime}
              </span>
            </label>
            <input
              type="time"
              className="ppwsa-input font-bold"
              required
              step={300}
              value={returnTime}
              onChange={e => setReturnTime(e.target.value)}
            />
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              If completed early, the vehicle is released immediately for colleagues to book.
            </div>
          </div>

          {/* Ending Odometer */}
          <div className="form-group-block">
            <label className="form-label-bold">Ending Odometer (km)</label>
            <input
              type="number"
              className="ppwsa-input"
              placeholder="e.g. 48,250"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
            />
          </div>

          {/* Completion Notes */}
          <div className="form-group-block">
            <label className="form-label-bold">Completion Notes (Optional)</label>
            <textarea
              className="ppwsa-textarea"
              rows={2}
              placeholder="e.g. Arrived safely at destination. Passenger dropped off."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-ppwsa-primary h-11 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 font-bold"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>Confirm &amp; Mark Task Completed</span>
          </button>
        </form>
      </div>
    </div>
  );
}

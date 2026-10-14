'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { X, AlertCircle } from 'lucide-react';

export function RejectReasonModal() {
  const {
    rejectModalOpen,
    rejectBookingId,
    closeRejectModal,
    rejectBooking,
    showToast,
  } = useApp();

  const [reason, setReason] = useState<string>('');

  if (!rejectModalOpen || !rejectBookingId) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please state the rejection reason.', 'error');
      return;
    }
    rejectBooking(rejectBookingId, reason.trim());
    setReason('');
  };

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeRejectModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeRejectModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">Reject Request</div>
          <button type="button" className="sheet-close-round" onClick={closeRejectModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="sheet-scroll-body space-y-3">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Please state the business reason for rejecting this vehicle request. The staff member will receive this notification.
          </p>

          <div className="form-group-block">
            <label className="form-label-bold">
              <span>Rejection Reason</span>
              <span className="req-mark">*</span>
            </label>
            <textarea
              className="ppwsa-textarea"
              required
              rows={3}
              placeholder="e.g. Vehicle priority assigned for executive inspection tour."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="chip-btn flex-1 h-10 text-xs justify-center"
              onClick={closeRejectModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-ppwsa-primary flex-1 h-10 text-xs bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 font-bold"
            >
              <X className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

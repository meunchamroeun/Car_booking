'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { X,  RotateCcw  } from 'lucide-react';

export function PassSheetModal() {
  const {
    passModalOpen,
    passBookingId,
    closePassModal,
    openEarlyReturnModal,
    bookings,
    cars,
    users,
    drivers,
  } = useApp();

  if (!passModalOpen || !passBookingId) return null;

  const b = bookings.find(x => x.id === passBookingId);
  if (!b) return null;

  const car = cars.find(c => c.id === b.carId);
  const req = users.find(u => u.id === b.requesterId);
  const driver = b.driverId ? drivers.find(d => d.id === b.driverId) : null;

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closePassModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closePassModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">Digital Booking Pass</div>
          <button type="button" className="sheet-close-round" onClick={closePassModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="sheet-scroll-body">
          {/* VIP Pass Card */}
          <div
            className="rounded-3xl p-5 text-white relative overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 45%, #7c3aed 80%, #170b28 100%)',
              boxShadow: '0 12px 36px rgba(76, 29, 149, 0.35)',
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Authority Boarding Pass
              </span>
              <span
                className="status-badge available"
                style={
                  b.returnedEarly
                    ? { background: 'rgba(34, 197, 94, 0.25)', color: '#86efac', borderColor: '#86efac' }
                    : { background: 'rgba(74, 222, 128, 0.22)', color: '#86efac', borderColor: 'rgba(74, 222, 128, 0.4)' }
                }
              >
                {b.returnedEarly ? 'RETURNED EARLY' : b.status === 'Approved' ? 'CONFIRMED' : b.status.toUpperCase()}
              </span>
            </div>

            <div className="text-[20px] font-extrabold mt-3 mb-0.5">{car ? car.name : 'Car'}</div>
            <div className="text-[12.5px] text-white/80 font-mono">
              {car ? car.plate : ''} · {car ? car.type : ''}
            </div>

            {/* QR Scanner Container */}
            <div className="text-center my-4">
              <div className="bg-white p-3 rounded-2xl inline-block shadow-lg relative">
                {/* Visual animated QR code */}
                <div className="relative">
                  <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.8">
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                    <rect x="4" y="4" width="4" height="4" fill="#6d28d9" />
                    <rect x="14" y="2" width="8" height="8" rx="1" />
                    <rect x="16" y="4" width="4" height="4" fill="#6d28d9" />
                    <rect x="2" y="14" width="8" height="8" rx="1" />
                    <rect x="4" y="16" width="4" height="4" fill="#6d28d9" />
                    <line x1="14" y1="14" x2="14" y2="17" />
                    <line x1="17" y1="14" x2="21" y2="14" />
                    <line x1="18" y1="18" x2="22" y2="18" />
                    <line x1="18" y1="21" x2="21" y2="21" />
                  </svg>
                  {/* Subtle scan laser animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444] animate-[qrScan_2.5s_ease-in-out_infinite]" />
                </div>
              </div>
              <div className="text-[11px] text-white/70 mt-2 font-medium">
                Present QR to Guardhouse / Dispatcher
              </div>
            </div>

            {/* Mission Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs border-t border-dashed border-white/20 pt-3">
              <div>
                <span className="text-white/60">Staff Member:</span>
                <div className="font-bold text-[12.5px]">{req ? req.name : ''}</div>
              </div>
              <div>
                <span className="text-white/60">Mission Date:</span>
                <div className="font-bold text-[12.5px]">{b.startDate}</div>
              </div>
              <div>
                <span className="text-white/60">Time Window:</span>
                <div className="font-bold text-[12.5px]">
                  {b.startTime} – {b.endTime}
                </div>
              </div>
              <div>
                <span className="text-white/60">Allocated Driver:</span>
                <div className="font-bold text-[12.5px]">{driver ? driver.name : 'Self-drive'}</div>
              </div>
            </div>
          </div>

          {/* Return Early CTA Button */}
          {b.status === 'Approved' ? (
            <div className="mt-2">
              <button
                type="button"
                className="btn-early-return w-full h-11.5 justify-center gap-2.5 rounded-full"
                onClick={() => {
                  closePassModal();
                  openEarlyReturnModal(b.id);
                }}
              >
                <span className="btn-early-return-icon-badge w-7 h-7">
                  <RotateCcw className="w-3.5 h-3.5" />
                </span>
                <span className="btn-early-return-text-group flex-initial">
                  <span className="btn-early-return-main text-xs sm:text-sm">
                    Return Early • Mark as Available
                  </span>
                  <span className="btn-early-return-sub text-[10px] text-center">
                    Finished mission early? Release car slot for colleagues
                  </span>
                </span>
              </button>
            </div>
          ) : b.returnedEarly ? (
            <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 text-emerald-800 dark:text-emerald-300 text-center">
              <div className="font-bold text-xs">
                Vehicle Returned Early at {b.actualEndTime || b.endTime}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Scheduled until {b.originalEndTime || '12:00'}. Vehicle slot released for colleagues.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

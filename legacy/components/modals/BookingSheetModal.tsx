'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { CarIllustration } from '@/components/common/CarIllustrations';
import { DateUtil } from '@/lib/date-utils';
import { X, Calendar, AlertTriangle, Check, Zap } from 'lucide-react';

export function BookingSheetModal() {
  const {
    bookingModalOpen,
    bookingCarIdPrefill,
    bookingStartPrefill,
    bookingEndPrefill,
    closeBookingModal,
    cars,
    bookings,
    selectedDate,
    createBooking,
    checkCarConflict,
    showToast,
    t,
  } = useApp();

  const [carId, setCarId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [purpose, setPurpose] = useState<string>('');
  const [needDriver, setNeedDriver] = useState<boolean>(false);
  const [destination, setDestination] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(1);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bookingModalOpen) {
      const defaultCar = bookingCarIdPrefill || cars[0]?.id || '';
      setCarId(defaultCar);
      const targetDate = selectedDate || DateUtil.todayStr();
      setStartDate(targetDate);
      setEndDate(targetDate);
      setStartTime(bookingStartPrefill || '09:00');
      setEndTime(bookingEndPrefill || '12:00');
      setPurpose('');
      setNeedDriver(false);
      setDestination('');
      setPassengers(1);
      setConflictMsg(null);
    }
  }, [bookingModalOpen, bookingCarIdPrefill, bookingStartPrefill, bookingEndPrefill, selectedDate, cars]);

  // Validate conflict on change
  useEffect(() => {
    if (!carId || !startDate || !startTime || !endDate || !endTime) return;

    if (startDate < DateUtil.todayStr()) {
      setConflictMsg('Cannot create vehicle bookings for past dates.');
      return;
    }

    if (endDate < startDate || (startDate === endDate && DateUtil.toMins(endTime) <= DateUtil.toMins(startTime))) {
      setConflictMsg('End time must be after start time.');
      return;
    }

    const res = checkCarConflict(carId, startDate, startTime, endTime);
    if (res.isConflict) {
      setConflictMsg(res.reason || 'Time conflict detected with an existing reservation.');
    } else {
      setConflictMsg(null);
    }
  }, [carId, startDate, startTime, endDate, endTime, checkCarConflict]);

  if (!bookingModalOpen) return null;

  const selectedCar = cars.find(c => c.id === carId);

  // Existing bookings on this day for the selected vehicle
  const dayApproved = bookings.filter(
    b => b.carId === carId && b.startDate === startDate && (b.status === 'Approved' || (b.status === 'Completed' && b.returnedEarly))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      showToast('Please specify your booking purpose.', 'error');
      return;
    }
    if (conflictMsg) {
      showToast(conflictMsg, 'error');
      return;
    }

    createBooking({
      carId,
      startDate,
      startTime,
      endDate,
      endTime,
      purpose: purpose.trim(),
      needDriver,
      destination: destination.trim(),
      passengers,
    });
  };

  const isToday = startDate === DateUtil.todayStr();
  const isTomorrow = startDate === DateUtil.tomorrowStr();

  const isMorning = startTime === '08:00' && endTime === '12:00';
  const isAfternoon = startTime === '13:00' && endTime === '17:00';
  const isFull = startTime === '08:00' && endTime === '17:00';

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeBookingModal();
      }}
    >
      <div className="bottom-sheet-panel">
        {/* Handle */}
        <div className="sheet-handle-zone" onClick={closeBookingModal}>
          <div className="sheet-handle-pill" />
        </div>

        {/* Header */}
        <div className="sheet-header-row">
          <div className="sheet-title-text">{t('new_booking')}</div>
          <button
            type="button"
            className="sheet-close-round"
            onClick={closeBookingModal}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll Body */}
        <form onSubmit={handleSubmit} className="sheet-scroll-body">
          {/* Selected Vehicle Preview */}
          {selectedCar && (
            <div className="flex items-center gap-3 bg-[var(--card-alt)] p-3 rounded-2xl border border-[var(--border)]">
              <div className="w-14 h-9 shrink-0">
                <CarIllustration type={selectedCar.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[13.5px] text-[var(--text)] truncate">
                  {selectedCar.name}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                  <span className="vehicle-plate-pill">{selectedCar.plate}</span>
                  <span>{selectedCar.type}</span>
                  <span>· Max {selectedCar.seats} Pax</span>
                </div>
              </div>
            </div>
          )}

          {/* Existing reservations callout */}
          <div>
            {!dayApproved.length ? (
              <div className="text-[11.5px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                No reservations on {startDate}. Full day is open!
              </div>
            ) : (
              <div className="text-[11.5px] text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-300 dark:border-rose-800 space-y-1">
                <strong>Already reserved slots on {startDate}:</strong>
                {dayApproved.map(b => (
                  <div key={b.id} className="text-xs">
                    • {b.startTime}–{b.endTime} (&ldquo;{b.purpose}&rdquo;)
                    {b.returnedEarly && (
                      <span className="text-emerald-600 font-bold ml-1">
                        (Returned early · Open from {b.endTime} onward )
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Select Section */}
          <div className="bg-[var(--card-alt)] rounded-2xl border border-[var(--border)] p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-[var(--c-primary)] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Quick Select</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">Today &amp; Tomorrow presets</span>
            </div>

            {/* Day Pills */}
            <div className="flex gap-2">
              <button
                type="button"
                className={`chip-btn flex-1 ${isToday ? 'active' : ''}`}
                onClick={() => {
                  setStartDate(DateUtil.todayStr());
                  setEndDate(DateUtil.todayStr());
                }}
              >
                Today
              </button>
              <button
                type="button"
                className={`chip-btn flex-1 ${isTomorrow ? 'active' : ''}`}
                onClick={() => {
                  setStartDate(DateUtil.tomorrowStr());
                  setEndDate(DateUtil.tomorrowStr());
                }}
              >
                Tomorrow
              </button>
            </div>

            {/* Slot Pills */}
            <div className="slot-row">
              <button
                type="button"
                className={`slot-pill ${isMorning ? 'active' : ''}`}
                onClick={() => {
                  setStartTime('08:00');
                  setEndTime('12:00');
                }}
              >
                Morning (08–12)
              </button>
              <button
                type="button"
                className={`slot-pill ${isAfternoon ? 'active' : ''}`}
                onClick={() => {
                  setStartTime('13:00');
                  setEndTime('17:00');
                }}
              >
                Afternoon (13–17)
              </button>
              <button
                type="button"
                className={`slot-pill ${isFull ? 'active' : ''}`}
                onClick={() => {
                  setStartTime('08:00');
                  setEndTime('17:00');
                }}
              >
                Full Day
              </button>
            </div>
          </div>

          {/* Date & Time Inputs */}
          <div className="form-grid-2">
            <div className="form-group-block">
              <label className="form-label-bold">
                <span>Start Date</span>
                <span className="req-mark">*</span>
              </label>
              <input
                type="date"
                className="ppwsa-input"
                required
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
            </div>
            <div className="form-group-block">
              <label className="form-label-bold">
                <span>Start Time</span>
                <span className="req-mark">*</span>
              </label>
              <input
                type="time"
                className="ppwsa-input"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group-block">
              <label className="form-label-bold">
                <span>End Date</span>
                <span className="req-mark">*</span>
              </label>
              <input
                type="date"
                className="ppwsa-input"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <div className="form-group-block">
              <label className="form-label-bold">
                <span>End Time</span>
                <span className="req-mark">*</span>
              </label>
              <input
                type="time"
                className="ppwsa-input"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Booking Purpose */}
          <div className="form-group-block">
            <div className="form-label-bold">
              <span>
                Booking Purpose <span className="req-mark">*</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {purpose.length} / 250
              </span>
            </div>
            <textarea
              className="ppwsa-textarea"
              maxLength={250}
              required
              rows={2}
              placeholder="e.g. Inspect water booster station in Chbar Ampov"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
            />
          </div>

          {/* Need Corporate Driver */}
          <div className="form-group-block">
            <label className="form-label-bold">
              <span>{t('driver_choice')}</span>
              <span className="req-mark">*</span>
            </label>
            <div className="driver-selector-grid">
              <div
                className={`driver-choice-box ${!needDriver ? 'active' : ''}`}
                onClick={() => setNeedDriver(false)}
              >
                <input
                  type="radio"
                  name="needDriver"
                  checked={!needDriver}
                  onChange={() => setNeedDriver(false)}
                />
                <div>
                  <div className="text-[12px] font-bold text-[var(--text)]">{t('self_drive')}</div>
                  <div className="text-[10.5px] text-[var(--text-muted)]">{t('self_drive_desc')}</div>
                </div>
              </div>

              <div
                className={`driver-choice-box ${needDriver ? 'active' : ''}`}
                onClick={() => setNeedDriver(true)}
              >
                <input
                  type="radio"
                  name="needDriver"
                  checked={needDriver}
                  onChange={() => setNeedDriver(true)}
                />
                <div>
                  <div className="text-[12px] font-bold text-[var(--text)]">{t('assign_driver')}</div>
                  <div className="text-[10.5px] text-[var(--text-muted)]">{t('assign_driver_desc')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Destination & Passengers */}
          <div className="form-grid-2">
            <div className="form-group-block">
              <label className="form-label-bold">Destination (Optional)</label>
              <input
                type="text"
                className="ppwsa-input"
                placeholder="e.g. Regional depot branch"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>
            <div className="form-group-block">
              <label className="form-label-bold">Passengers</label>
              <input
                type="number"
                className="ppwsa-input"
                min={1}
                max={selectedCar?.seats || 12}
                value={passengers}
                onChange={e => setPassengers(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Conflict Alert Banner */}
          {conflictMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-2.5 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{conflictMsg}</span>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            className="btn-ppwsa-primary btn-booking-hero"
            disabled={Boolean(conflictMsg)}
          >
            <Check className="w-4.5 h-4.5" />
            <span>{t('submit_request')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

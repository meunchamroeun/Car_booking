'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { CarIllustration } from '@/components/common/CarIllustrations';
import { DateUtil } from '@/lib/date-utils';
import { X,  Wrench, Calendar, Check, ArrowRight, AlertTriangle  } from 'lucide-react';

export function MaintenanceModal() {
  const {
    maintenanceModalOpen,
    maintenanceCarId,
    maintenanceDefaultMode,
    closeMaintenanceModal,
    cars,
    bookings,
    setCarManualMaintenance,
    setCarScheduledMaintenance,
    restoreCarToAvailable,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'manual' | 'scheduled'>('manual');

  // Manual fields
  const [manualReason, setManualReason] = useState<string>('');
  const [manualEstDate, setManualEstDate] = useState<string>('');

  // Scheduled fields
  const [schedReason, setSchedReason] = useState<string>('Periodic 10,000 km Technical Servicing');
  const [schedWorkshop, setSchedWorkshop] = useState<string>('Main Fleet Technical Depot');
  const [schedStartDate, setSchedStartDate] = useState<string>(DateUtil.todayStr());
  const [schedStartTime, setSchedStartTime] = useState<string>('08:00');
  const [schedEndDate, setSchedEndDate] = useState<string>(DateUtil.todayStr());
  const [schedEndTime, setSchedEndTime] = useState<string>('17:00');

  // Restore field
  const [restoreNotes, setRestoreNotes] = useState<string>('');

  const car = cars.find(c => c.id === maintenanceCarId);

  useEffect(() => {
    if (maintenanceModalOpen) {
      setMode(maintenanceDefaultMode || 'manual');
      setManualReason('');
      setManualEstDate(DateUtil.tomorrowStr());
      setSchedReason('Periodic 10,000 km Technical Servicing');
      setSchedWorkshop('Main Fleet Technical Depot');
      setSchedStartDate(DateUtil.todayStr());
      setSchedStartTime('08:00');
      setSchedEndDate(DateUtil.todayStr());
      setSchedEndTime('17:00');
      setRestoreNotes('');
    }
  }, [maintenanceModalOpen, maintenanceDefaultMode]);

  if (!maintenanceModalOpen || !car) return null;

  const isCurrentlyMaint = car.status === 'Maintenance';
  const maintInfo = car.maintenance;

  // Check approved bookings today
  const dayApproved = bookings.filter(
    b => b.carId === car.id && b.startDate === DateUtil.todayStr() && b.status === 'Approved'
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason.trim()) {
      showToast('Please describe the maintenance reason.', 'error');
      return;
    }
    setCarManualMaintenance(car.id, manualReason.trim(), manualEstDate || null);
  };

  const handleScheduledSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedReason.trim()) {
      showToast('Please specify the service title.', 'error');
      return;
    }
    if (schedEndDate < schedStartDate) {
      showToast('End date cannot be earlier than start date.', 'error');
      return;
    }
    setCarScheduledMaintenance(
      car.id,
      schedReason.trim(),
      schedWorkshop.trim(),
      schedStartDate,
      schedStartTime,
      schedEndDate,
      schedEndTime
    );
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    restoreCarToAvailable(car.id, restoreNotes.trim());
  };

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeMaintenanceModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeMaintenanceModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">
            {isCurrentlyMaint ? 'Restore Vehicle to Service' : 'Set Vehicle to Maintenance'}
          </div>
          <button type="button" className="sheet-close-round" onClick={closeMaintenanceModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="sheet-scroll-body">
          {/* Vehicle summary header */}
          <div className="flex items-center gap-3 bg-[var(--card-alt)] p-3 rounded-2xl border border-[var(--border)]">
            <div className="w-13 h-8 shrink-0">
              <CarIllustration type={car.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[13.5px] text-[var(--text)] truncate">
                {car.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                <span className="vehicle-plate-pill">{car.plate}</span>
                <span>{car.type}</span>
                <span>· {car.seats} Seats</span>
              </div>
            </div>
          </div>

          {/* VIEW A: IF ALREADY UNDER MAINTENANCE -> RESTORE FLOW */}
          {isCurrentlyMaint ? (
            <form onSubmit={handleRestoreSubmit} className="space-y-3">
              {/* Current maintenance info box */}
              <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 rounded-2xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-800 dark:text-rose-300">
                    {maintInfo?.mode === 'scheduled' ? 'Scheduled Maintenance Active' : 'Manual Maintenance Active'}
                  </span>
                  <span className="status-badge maintenance text-[9.5px]">In Service</span>
                </div>
                <div className="text-[var(--text)]">
                  <strong>Reason / Work:</strong> {maintInfo?.reason || 'Technical servicing'}
                </div>
                {maintInfo?.mode === 'scheduled' ? (
                  <div className="text-[var(--text-muted)]">
                    <strong>Scheduled Window:</strong> {maintInfo.startDate} ({maintInfo.startTime}) to{' '}
                    {maintInfo.endDate} ({maintInfo.endTime})
                  </div>
                ) : maintInfo?.estimatedDate ? (
                  <div className="text-[var(--text-muted)]">
                    <strong>Est. Completion:</strong> {maintInfo.estimatedDate}
                  </div>
                ) : null}
              </div>

              {/* Status Transition visualization */}
              <div className="flex items-center justify-around bg-[var(--card-alt)] border border-[var(--border)] rounded-2xl p-3">
                <div className="text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Current Status</div>
                  <span className="status-badge maintenance">In Service</span>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
                <div className="text-center">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase mb-1">New Status</div>
                  <span className="status-badge available">● Active / Available</span>
                </div>
              </div>

              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Putting this vehicle back to <strong>Available</strong> will immediately enable reservations for staff missions.
              </div>

              <div className="form-group-block">
                <label className="form-label-bold">Service Completion Notes (Optional)</label>
                <input
                  type="text"
                  className="ppwsa-input"
                  placeholder="e.g. Technical inspection passed, vehicle cleaned and ready"
                  value={restoreNotes}
                  onChange={e => setRestoreNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="chip-btn flex-1 h-10.5 text-xs justify-center"
                  onClick={closeMaintenanceModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ppwsa-primary flex-1.5 h-10.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 font-bold"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Available</span>
                </button>
              </div>
            </form>
          ) : (
            /* VIEW B: SET TO MAINTENANCE (Option 1: Manual vs Option 2: Scheduled) */
            <div className="space-y-3">
              <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                Select Maintenance Option
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`maint-tab-btn ${mode === 'manual' ? 'active' : ''}`}
                  onClick={() => setMode('manual')}
                >
                  <Wrench className="w-5 h-5 mx-auto mb-1 text-violet-600" />
                  <div className="font-extrabold text-[11.5px]">1. Set Manually</div>
                  <div className="text-[9.5px] opacity-75">Immediate offline</div>
                </button>

                <button
                  type="button"
                  className={`maint-tab-btn ${mode === 'scheduled' ? 'active' : ''}`}
                  onClick={() => setMode('scheduled')}
                >
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-violet-600" />
                  <div className="font-extrabold text-[11.5px]">2. Set Schedule</div>
                  <div className="text-[9.5px] opacity-75">Planned window</div>
                </button>
              </div>

              {/* Mode 1: Manual Form */}
              {mode === 'manual' ? (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-[var(--text)]">Option 1: Manual Maintenance</span>
                      <span className="status-badge" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', fontSize: '9px' }}>
                        Immediate
                      </span>
                    </div>
                    <div className="text-[var(--text-secondary)] leading-relaxed">
                      Takes vehicle offline immediately for unscheduled repairs. Remains unavailable until manually restored.
                    </div>
                  </div>

                  {dayApproved.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Active Bookings Alert:</strong> This vehicle has <strong>{dayApproved.length}</strong> approved booking(s) scheduled for today.
                      </span>
                    </div>
                  )}

                  <div className="form-group-block">
                    <label className="form-label-bold">
                      <span>Maintenance Reason / Issue Description</span>
                      <span className="req-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="ppwsa-input"
                      required
                      placeholder="e.g. Brake pad wear, check engine light, flat tire"
                      value={manualReason}
                      onChange={e => setManualReason(e.target.value)}
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="form-label-bold">Estimated Return to Service Date (Optional)</label>
                    <input
                      type="date"
                      className="ppwsa-input"
                      value={manualEstDate}
                      onChange={e => setManualEstDate(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="chip-btn flex-1 h-10 text-xs justify-center"
                      onClick={closeMaintenanceModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-ppwsa-primary flex-1.5 h-10 text-xs bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 font-bold"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Set to Maintenance Manually</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Mode 2: Scheduled Form */
                <form onSubmit={handleScheduledSubmit} className="space-y-3">
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-[var(--text)]">Option 2: Schedule Maintenance</span>
                      <span className="status-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '9px' }}>
                        Planned Window
                      </span>
                    </div>
                    <div className="text-[var(--text-secondary)] leading-relaxed">
                      Reserve a future maintenance window. The vehicle will automatically be blocked during the scheduled timeframe.
                    </div>
                  </div>

                  <div className="form-group-block">
                    <label className="form-label-bold">
                      <span>Service Title / Work Description</span>
                      <span className="req-mark">*</span>
                    </label>
                    <input
                      type="text"
                      className="ppwsa-input"
                      required
                      placeholder="e.g. Periodic 10,000 km Technical Servicing"
                      value={schedReason}
                      onChange={e => setSchedReason(e.target.value)}
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="form-label-bold">Authorized Workshop / Service Depot</label>
                    <input
                      type="text"
                      className="ppwsa-input"
                      placeholder="e.g. Main Fleet Technical Depot"
                      value={schedWorkshop}
                      onChange={e => setSchedWorkshop(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="form-group-block">
                      <label className="form-label-bold">Start Date</label>
                      <input
                        type="date"
                        className="ppwsa-input"
                        required
                        value={schedStartDate}
                        onChange={e => {
                          setSchedStartDate(e.target.value);
                          if (schedEndDate < e.target.value) setSchedEndDate(e.target.value);
                        }}
                      />
                    </div>
                    <div className="form-group-block">
                      <label className="form-label-bold">Start Time</label>
                      <input
                        type="time"
                        className="ppwsa-input"
                        required
                        value={schedStartTime}
                        onChange={e => setSchedStartTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="form-group-block">
                      <label className="form-label-bold">End Date</label>
                      <input
                        type="date"
                        className="ppwsa-input"
                        required
                        value={schedEndDate}
                        onChange={e => setSchedEndDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group-block">
                      <label className="form-label-bold">End Time</label>
                      <input
                        type="time"
                        className="ppwsa-input"
                        required
                        value={schedEndTime}
                        onChange={e => setSchedEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-[var(--c-primary-tint)] border border-[rgba(var(--c-primary-rgb),0.25)] rounded-xl text-[11px] text-[var(--c-primary-dk)]">
                    {schedStartDate <= DateUtil.todayStr()
                      ? 'Starts today: Vehicle status will switch to Maintenance immediately.'
                      : `Scheduled for ${schedStartDate}: Vehicle remains Available today and will be blocked during the scheduled maintenance window.`}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="chip-btn flex-1 h-10 text-xs justify-center"
                      onClick={closeMaintenanceModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-ppwsa-primary flex-1.5 h-10 text-xs font-bold"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Set Schedule Maintenance</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

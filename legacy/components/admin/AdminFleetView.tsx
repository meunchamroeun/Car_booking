'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { DateUtil } from '@/lib/date-utils';
import {
  Wrench,
  CheckCircle,
  AlertCircle,
  Users,
  RotateCcw,
  Shield,
  Clock,
  Check,
} from 'lucide-react';

export function AdminFleetView() {
  const {
    currentUser,
    cars,
    drivers,
    bookings,
    adminVehicleFilter,
    setAdminVehicleFilter,
    isCarInMaintenance,
    openMaintenanceModal,
    clearCarScheduledMaintenance,
    resetDemoData,
    t,
  } = useApp();

  const canManage = currentUser.role === 'Approver' || currentUser.role === 'Admin';

  const activeCount = cars.filter(c => c.status === 'Active').length;
  const maintCount = cars.filter(c => c.status === 'Maintenance').length;
  const bookedTodayCount = bookings.filter(
    b => b.startDate === DateUtil.todayStr() && b.status === 'Approved'
  ).length;

  let filteredCars = cars;
  if (adminVehicleFilter === 'active') {
    filteredCars = filteredCars.filter(c => c.status === 'Active');
  } else if (adminVehicleFilter === 'maint') {
    filteredCars = filteredCars.filter(c => c.status === 'Maintenance');
  }

  return (
    <div className="space-y-3.5 pb-2 px-3.5 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-start py-1">
        <div>
          <h2 className="text-[16px] font-extrabold text-[var(--text)] tracking-tight">
            {t('admin_title')}
          </h2>
          <p className="text-[11.5px] text-[var(--text-secondary)]">
            {t('admin_desc')}
          </p>
        </div>
        <span
          className="status-badge"
          style={{
            background: canManage
              ? currentUser.role === 'Admin'
                ? '#f5f3ff'
                : '#fffbeb'
              : 'var(--c-primary-tint)',
            color: canManage
              ? currentUser.role === 'Admin'
                ? '#7c3aed'
                : '#b45309'
              : 'var(--c-primary)',
            fontSize: '10.5px',
          }}
        >
          {canManage
            ? currentUser.role === 'Admin'
              ? 'Administrator'
              : 'Approver'
            : `${currentUser.role} View`}
        </span>
      </div>

      {/* Fleet Health Metrics Card */}
      <div className="filter-card">
        <div className="filter-title-micro">Today&apos;s Fleet Health</div>
        <div className="grid grid-cols-3 gap-2 text-center mt-1.5">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
              {activeCount}
            </div>
            <div className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
              Active Cars
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="text-xl font-extrabold text-amber-800 dark:text-amber-300">
              {bookedTodayCount}
            </div>
            <div className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400">
              Booked Today
            </div>
          </div>
          <div className="bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border)]">
            <div className="text-xl font-extrabold text-[var(--text)]">{maintCount}</div>
            <div className="text-[10.5px] font-bold text-[var(--text-muted)]">In Service</div>
          </div>
        </div>
      </div>

      {/* Fleet Maintenance Section */}
      <div className="filter-card space-y-2.5">
        <div className="flex justify-between items-center">
          <div>
            <div className="filter-title-micro mb-0.5">{t('fleet_mgmt')}</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Set vehicles to maintenance or put back into available
            </div>
          </div>
          <span className="vehicle-plate-pill text-[10px]">{cars.length} Cars</span>
        </div>

        {/* Role permission info */}
        {canManage ? (
          <div className="flex items-center gap-2 p-2 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
            <Shield className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Authorized as <strong>{currentUser.name}</strong> ({currentUser.role}). You have permission to toggle vehicle maintenance.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Viewing as Employee. Maintenance modifications require Approver or Admin rights.
            </span>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            className={`chip-btn text-[10.5px] h-7 px-2.5 ${adminVehicleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setAdminVehicleFilter('all')}
          >
            All Cars ({cars.length})
          </button>
          <button
            type="button"
            className={`chip-btn text-[10.5px] h-7 px-2.5 ${adminVehicleFilter === 'active' ? 'active' : ''}`}
            onClick={() => setAdminVehicleFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`chip-btn text-[10.5px] h-7 px-2.5 ${adminVehicleFilter === 'maint' ? 'active' : ''}`}
            onClick={() => setAdminVehicleFilter('maint')}
          >
            Under Service ({maintCount})
          </button>
        </div>

        {/* Vehicle list */}
        <div className="space-y-2 mt-2">
          {filteredCars.map(c => {
            const isMaint = isCarInMaintenance(c, DateUtil.todayStr());
            const maintInfo = c.maintenance;
            const hasFutureSched =
              !isMaint && maintInfo && maintInfo.mode === 'scheduled' && (maintInfo.startDate || '') > DateUtil.todayStr();

            return (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-purple-300/40 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[13.5px] text-[var(--text)]">{c.name}</div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                      <span className="vehicle-plate-pill text-[10px]">{c.plate}</span>
                      <span>{c.type}</span>
                      <span>· {c.seats} Seats</span>
                    </div>
                  </div>
                  <div>
                    {isMaint ? (
                      <span className="status-badge maintenance">
                        {maintInfo?.mode === 'scheduled' ? 'Scheduled Service' : 'Service'}
                      </span>
                    ) : (
                      <span className="status-badge available">Active Duty</span>
                    )}
                  </div>
                </div>

                {/* Maintenance detail callout */}
                {isMaint && maintInfo && (
                  <div className="text-[11px] text-rose-800 dark:text-rose-300 mt-2 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900 leading-relaxed">
                    <strong>{maintInfo.mode === 'scheduled' ? 'Scheduled:' : 'Manual:'}</strong>{' '}
                    {maintInfo.reason || 'Under technical servicing'}
                    {maintInfo.mode === 'scheduled'
                      ? ` (${maintInfo.startDate} ${maintInfo.startTime || '08:00'} – ${maintInfo.endDate} ${maintInfo.endTime || '17:00'})`
                      : maintInfo.estimatedDate
                      ? ` · Est: ${maintInfo.estimatedDate}`
                      : ''}
                  </div>
                )}

                {hasFutureSched && maintInfo && (
                  <div className="text-[11px] text-purple-900 dark:text-purple-300 mt-2 bg-purple-50 dark:bg-purple-950/30 p-2 rounded-lg border border-purple-200 dark:border-purple-900 flex justify-between items-center">
                    <div>
                      <strong>Upcoming Maintenance:</strong> {maintInfo.startDate} ({maintInfo.startTime}–{maintInfo.endTime})
                      <div className="text-[10px] text-[var(--text-muted)]">{maintInfo.reason}</div>
                    </div>
                    <button
                      type="button"
                      className="chip-btn text-[9.5px] h-6 px-2 text-rose-600"
                      onClick={() => clearCarScheduledMaintenance(c.id)}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Footer action */}
                <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center">
                  <div className="text-[10.5px] text-[var(--text-muted)]">
                    {isMaint ? 'Unavailable for booking' : 'Ready for reservations'}
                  </div>
                  <div>
                    {isMaint ? (
                      <button
                        type="button"
                        className="btn-ppwsa-primary text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                        onClick={() => openMaintenanceModal(c.id, 'manual')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('put_avail_btn')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-maint-set text-xs h-8 px-3"
                        onClick={() => openMaintenanceModal(c.id, 'manual')}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{t('set_maint_btn')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Drivers Directory */}
      <div className="filter-card">
        <div className="filter-title-micro">Company Drivers Directory</div>
        <div className="divide-y divide-[var(--border-subtle)] mt-1">
          {drivers.map(d => (
            <div key={d.id} className="py-2.5 flex justify-between items-center">
              <div>
                <div className="font-bold text-[13px] text-[var(--text)]">{d.name}</div>
                <div className="text-[11px] text-[var(--text-muted)]">{d.phone}</div>
              </div>
              <span className="status-badge available text-[10.5px]">Active Duty</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Actions Card */}
      <div className="filter-card">
        <div className="filter-title-micro">Prototype Demo Controls</div>
        <button
          type="button"
          className="chip-btn w-full h-11 text-xs justify-center font-bold mt-2"
          onClick={() => {
            if (confirm('Reset all demo data back to factory defaults?')) {
              resetDemoData();
            }
          }}
        >
          <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>{t('reset_data')}</span>
        </button>
      </div>
    </div>
  );
}

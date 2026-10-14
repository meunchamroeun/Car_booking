'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import {
  Compass,
  Phone,
  Navigation,
  Car,
  Clock,
  Car as CarIcon,
  CheckCircle,
  Play,
  Check,
  User as UserIcon,
} from 'lucide-react';

export function DriverTasksView() {
  const {
    currentUser,
    users,
    cars,
    drivers,
    bookings,
    driverTasksFilter,
    setDriverTasksFilter,
    driverSelectedId,
    setDriverSelectedId,
    switchUser,
    startDriverMission,
    openCompleteTaskModal,
    t,
  } = useApp();

  const isDriver = currentUser.role === 'Driver';

  // Filter bookings that have a driver assigned
  let tasks = bookings.filter(b => b.needDriver && b.driverId && b.status !== 'Rejected' && b.status !== 'Cancelled');

  if (isDriver && currentUser.driverId) {
    tasks = tasks.filter(b => b.driverId === currentUser.driverId);
  } else if (driverSelectedId && driverSelectedId !== 'all') {
    tasks = tasks.filter(b => b.driverId === driverSelectedId);
  }

  if (driverTasksFilter === 'active') {
    tasks = tasks.filter(b => b.taskStatus !== 'Completed');
  } else if (driverTasksFilter === 'completed') {
    tasks = tasks.filter(b => b.taskStatus === 'Completed');
  }

  tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const activeCount = bookings.filter(
    b => b.needDriver && b.driverId && b.taskStatus !== 'Completed' && (!isDriver || b.driverId === currentUser.driverId)
  ).length;

  const completedCount = bookings.filter(
    b => b.needDriver && b.driverId && b.taskStatus === 'Completed' && (!isDriver || b.driverId === currentUser.driverId)
  ).length;

  return (
    <div className="space-y-3 pb-2 px-3.5 sm:px-0">
      {/* Header */}
      <div className="flex justify-between items-start py-1">
        <div>
          <h2 className="text-[16px] font-extrabold text-[var(--text)] flex items-center gap-2">
            <span>{isDriver ? t('driver_tasks_my') : t('driver_tasks_title')}</span>
            <span className="status-badge" style={{ background: 'var(--c-primary-tint)', color: 'var(--c-primary-dk)' }}>
              {activeCount} Active
            </span>
          </h2>
          <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
            {isDriver
              ? `Logged in as ${currentUser.name} · View destinations & complete trips`
              : 'Fleet driver assignments, routes & completion tracking'}
          </p>
        </div>
      </div>

      {/* Driver Persona Banner */}
      {!isDriver ? (
        <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Driver Persona Quick-Switch
            </span>
            <span className="text-[10.5px] text-[var(--text-muted)]">Current: {currentUser.name}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              className={`chip-btn text-[10.5px] h-7 px-2.5 ${driverSelectedId === 'all' ? 'active' : ''}`}
              onClick={() => setDriverSelectedId('all')}
            >
              All Drivers
            </button>
            <button
              type="button"
              className={`chip-btn text-[10.5px] h-7 px-2.5 ${currentUser.id === 'u5' ? 'active' : ''}`}
              onClick={() => switchUser('u5')}
            >
              Rithy Kong (Driver)
            </button>
            <button
              type="button"
              className={`chip-btn text-[10.5px] h-7 px-2.5 ${currentUser.id === 'u6' ? 'active' : ''}`}
              onClick={() => switchUser('u6')}
            >
              Bona Sam (Driver)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Car className="w-5 h-5 text-violet-600" />
            <div>
              <div className="font-extrabold text-[13px] text-emerald-800 dark:text-emerald-300">
                Driver Mode: {currentUser.name}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Phone: {currentUser.phone || '012 889 001'} · Ready for dispatch
              </div>
            </div>
          </div>
          <button
            type="button"
            className="chip-btn text-[10.5px] h-7 px-2.5 bg-white dark:bg-slate-800"
            onClick={() => switchUser('u4')}
          >
            Switch Approver
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <div className="scroll-chips-row mb-3">
        <button
          type="button"
          className={`chip-btn ${driverTasksFilter === 'active' ? 'active' : ''}`}
          onClick={() => setDriverTasksFilter('active')}
        >
          Active &amp; Assigned ({activeCount})
        </button>
        <button
          type="button"
          className={`chip-btn ${driverTasksFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setDriverTasksFilter('completed')}
        >
          Completed ({completedCount})
        </button>
        <button
          type="button"
          className={`chip-btn ${driverTasksFilter === 'all' ? 'active' : ''}`}
          onClick={() => setDriverTasksFilter('all')}
        >
          All Missions
        </button>
      </div>

      {/* Tasks List */}
      <div className="cards-stack">
        {!tasks.length ? (
          <div className="text-center py-12 px-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] text-[var(--text-secondary)]">
            <Compass className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2" />
            <p className="font-bold text-sm text-[var(--text)]">No driving tasks found</p>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              {driverTasksFilter === 'active'
                ? 'No pending driving assignments right now. New trips approved by managers will appear here.'
                : 'No completed tasks recorded under this filter.'}
            </p>
          </div>
        ) : (
          tasks.map(b => {
            const car = cars.find(c => c.id === b.carId);
            const requester = users.find(x => x.id === b.requesterId);
            const driver = drivers.find(d => d.id === b.driverId);
            const isTaskDone = b.taskStatus === 'Completed';
            const isInProgress = b.taskStatus === 'In Progress';

            return (
              <div
                key={b.id}
                className="vehicle-card space-y-3"
                style={{
                  borderLeft: !isTaskDone ? '4px solid var(--c-primary)' : undefined,
                  opacity: isTaskDone ? 0.92 : 1,
                }}
              >
                {/* Header */}
                <div className="vehicle-card-header mb-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold text-[var(--c-primary)] font-mono">
                        {b.id}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">·</span>
                      <span className="text-[12px] font-extrabold text-[var(--text)]">{b.startDate}</span>
                    </div>
                    <div className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />Time Window: <strong className="text-[var(--text)]">{b.startTime} – {b.endTime}</strong>
                    </div>
                  </div>
                  <div>
                    {isTaskDone ? (
                      <span className="status-badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="status-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        In Progress
                      </span>
                    ) : (
                      <span className="status-badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>
                        Assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. DRIVING FOR WHO */}
                <div className="bg-[var(--card-alt)] border border-[var(--border-subtle)] rounded-xl p-2.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Driving For Who? (Passenger Details)
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-[13.5px] text-[var(--text)]">
                        {requester ? requester.name : 'Corporate Staff'}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {requester ? requester.dept : 'HQ'} · <strong>{b.passengers || 1} Passenger(s)</strong>
                      </div>
                    </div>
                    {requester?.phone && (
                      <a
                        href={`tel:${requester.phone}`}
                        className="chip-btn h-7 text-[11px] px-2.5 gap-1.5 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{requester.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 2. WHERE */}
                <div className="bg-[var(--card-alt)] border border-[var(--border-subtle)] rounded-xl p-2.5 space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                    Where? (Route &amp; Destination)
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <span>Pickup: <strong>Corporate Fleet HQ Depot</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-extrabold text-[var(--text)]">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>
                      Destination: <span className="text-[var(--c-primary)]">{b.destination || 'Field Station / Project Depot'}</span>
                    </span>
                  </div>
                </div>

                {/* 3. MISSION PURPOSE & CAR */}
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Vehicle</div>
                    <div className="font-bold text-[var(--text)] mt-0.5">{car ? car.name : 'Car'}</div>
                    <div className="font-mono text-[var(--c-primary)] text-[10.5px]">
                      {car ? car.plate : ''} · {car ? car.seats : 4} Seats
                    </div>
                  </div>
                  <div className="bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Assigned Driver</div>
                    <div className="font-bold text-[var(--text)] mt-0.5">{driver ? driver.name : 'You'}</div>
                    <div className="text-[var(--text-muted)] text-[10.5px]">{driver ? driver.phone : ''}</div>
                  </div>
                </div>

                <div className="text-[11.5px] text-[var(--text-secondary)] bg-[var(--card-alt)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
                  <strong>Purpose:</strong> &ldquo;{b.purpose}&rdquo;
                </div>

                {/* 4. ACTIONS FOR DRIVER */}
                {isTaskDone ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2.5 text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                    Mission Completed at {b.completedAt || 'today'}
                    {b.completionNotes && (
                      <div className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Note: &ldquo;{b.completionNotes}&rdquo;
                      </div>
                    )}
                  </div>
                ) : isInProgress ? (
                  <button
                    type="button"
                    className="btn-ppwsa-primary w-full h-10.5 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                    onClick={() => openCompleteTaskModal(b.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Task as Completed</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="chip-btn active flex-1 h-9.5 text-xs justify-center"
                      onClick={() => startDriverMission(b.id)}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Trip</span>
                    </button>
                    <button
                      type="button"
                      className="btn-ppwsa-primary flex-1 h-9.5 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                      onClick={() => openCompleteTaskModal(b.id)}
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Completed</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

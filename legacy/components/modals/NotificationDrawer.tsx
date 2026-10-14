'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { X,  Bell, CheckCheck  } from 'lucide-react';

export function NotificationDrawer() {
  const {
    notifModalOpen,
    closeNotifModal,
    notifications,
    currentUser,
    openPassModal,
    t,
  } = useApp();

  if (!notifModalOpen) return null;

  const userNotifs = notifications.filter(n => n.userId === currentUser.id);

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeNotifModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeNotifModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-[var(--c-primary)]" />
            <span>{t('notifications')}</span>
          </div>
          <button type="button" className="sheet-close-round" onClick={closeNotifModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="sheet-scroll-body space-y-2.5">
          {!userNotifs.length ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No notifications yet</span>
            </div>
          ) : (
            userNotifs.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border transition-all ${
                  n.read
                    ? 'bg-[var(--card-alt)] border-[var(--border-subtle)]'
                    : 'bg-[var(--c-primary-tint)] border-[rgba(var(--c-primary-rgb),0.3)] shadow-sm'
                }`}
                onClick={() => {
                  if (n.bookingId) {
                    closeNotifModal();
                    openPassModal(n.bookingId);
                  }
                }}
              >
                <div className="flex justify-between items-start text-xs font-bold text-[var(--text)]">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">{n.time}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{n.text}</p>
                {n.bookingId && (
                  <div className="text-[10.5px] font-bold text-[var(--c-primary)] mt-1.5 flex items-center gap-1 cursor-pointer">
                    <span>View Booking Pass </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

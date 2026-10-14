'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { X,  Sun, Moon, Globe, Check, UserCheck, Shield, Car as CarIcon, Crown  } from 'lucide-react';

export function ProfilePreferencesModal() {
  const {
    profileModalOpen,
    closeProfileModal,
    currentUser,
    users,
    bookings,
    switchUser,
    theme,
    setTheme,
    lang,
    setLang,
    t,
  } = useApp();

  if (!profileModalOpen) return null;

  return (
    <div
      className="sheet-overlay active"
      onClick={e => {
        if (e.target === e.currentTarget) closeProfileModal();
      }}
    >
      <div className="bottom-sheet-panel">
        <div className="sheet-handle-zone" onClick={closeProfileModal}>
          <div className="sheet-handle-pill" />
        </div>

        <div className="sheet-header-row">
          <div className="sheet-title-text">{t('preferences')}</div>
          <button type="button" className="sheet-close-round" onClick={closeProfileModal}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="sheet-scroll-body space-y-3.5">
          {/* 1. Active Profile Header Card */}
          <div className="flex items-center gap-3 bg-[var(--card-alt)] p-3.5 rounded-2xl border border-[var(--border)]">
            <span className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-[15px] bg-gradient-to-br from-purple-500 to-indigo-700 shadow-md shadow-purple-900/20 shrink-0">
              {currentUser.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold text-[var(--text)] truncate">
                {currentUser.name}
              </div>
              <div className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 truncate">
                {currentUser.dept} · <strong className="text-[var(--c-primary)]">{currentUser.role}</strong>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>

          {/* 2. Preferences: Appearance & Language */}
          <div className="bg-[var(--card-alt)] rounded-2xl border border-[var(--border)] p-3.5 space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Preferences &amp; System Settings
            </div>

            {/* Theme switcher */}
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[13px] font-bold text-[var(--text)]">{t('appearance')}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Switch between Light &amp; Dark theme</div>
              </div>
              <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-full p-0.5 gap-1">
                <button
                  type="button"
                  className={`chip-btn h-8 px-3 text-[11px] border-none ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={`chip-btn h-8 px-3 text-[11px] border-none ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Language switcher */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <div className="text-[13px] font-bold text-[var(--text)]">{t('language')}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Interface language selection</div>
              </div>
              <div className="flex bg-[var(--card)] border border-[var(--border)] rounded-full p-0.5 gap-1">
                <button
                  type="button"
                  className={`chip-btn h-8 px-3 text-[11px] border-none ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  <span>🇬🇧 EN</span>
                </button>
                <button
                  type="button"
                  className={`chip-btn h-8 px-3 text-[11px] border-none ${lang === 'kh' ? 'active' : ''}`}
                  onClick={() => setLang('kh')}
                >
                  <span>🇰🇭 ខ្មែរ</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Demo Account Switcher */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              {t('switch_account')}
            </div>

            <div className="space-y-2">
              {users.map(usr => {
                const isActive = usr.id === currentUser.id;
                const isDriverUsr = usr.role === 'Driver';
                const isApproverUsr = usr.role === 'Approver';
                const isAdminUsr = usr.role === 'Admin';
                const activeTrips = isDriverUsr
                  ? bookings.filter(b => b.driverId === usr.driverId && b.taskStatus !== 'Completed').length
                  : 0;

                return (
                  <div
                    key={usr.id}
                    onClick={() => switchUser(usr.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isActive
                        ? 'border-[var(--c-primary)] bg-[var(--c-primary-tint)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--card-alt)] hover:border-purple-300/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8.5 h-8.5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{
                          background: isDriverUsr
                            ? '#15803d'
                            : isApproverUsr
                            ? '#b45309'
                            : isAdminUsr
                            ? '#7c3aed'
                            : 'var(--c-primary)',
                        }}
                      >
                        {usr.initials}
                      </span>
                      <div>
                        <div className="font-extrabold text-[13.5px] text-[var(--text)] flex items-center gap-1.5">
                          <span>{usr.name}</span>
                          {isDriverUsr && (
                            <span className="status-badge" style={{ fontSize: '9px', padding: '1px 5px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                              Driver
                            </span>
                          )}
                          {isApproverUsr && (
                            <span className="status-badge" style={{ fontSize: '9px', padding: '1px 5px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                              Approver
                            </span>
                          )}
                          {isAdminUsr && (
                            <span className="status-badge" style={{ fontSize: '9px', padding: '1px 5px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                              Administrator
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {usr.dept} · <strong>{usr.role}</strong>
                          {isDriverUsr && (
                            <span className="text-[var(--c-primary)] font-bold ml-1">
                              · {activeTrips ? `${activeTrips} Active Task(s)` : 'Available'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[11px] font-extrabold text-[var(--c-primary)] flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

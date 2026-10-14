'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Bell, ChevronDown } from 'lucide-react';

export function Header() {
  const { currentUser, unreadNotifsCount, openNotifModal, openProfileModal, t } = useApp();

  return (
    <header className="hero-container relative overflow-hidden pt-3 sm:pt-4 pb-7 text-white select-none">
      {/* Ambient glowing purple orbs & bubble elements */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />

      {/* Top action bar */}
      <div className="relative z-10 flex items-center justify-between px-3.5 sm:px-4 pb-2.5 gap-3">
        {/* Brand Group */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border-[1.5px] border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-950/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div>
            <div className="text-[19px] font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
              {t('app_title')}
            </div>
            <div className="text-[10px] font-semibold text-purple-200/90 tracking-wide uppercase">
              {t('app_subtitle')}
            </div>
          </div>
        </div>

        {/* Hero Actions on Right */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={openNotifModal}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 backdrop-blur-md border border-white/25 flex items-center justify-center text-white relative transition-all"
            title={t('notifications')}
          >
            <Bell className="w-4 h-4 text-white" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 border-2 border-purple-900 animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Profile Pill Button */}
          <button
            type="button"
            onClick={openProfileModal}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/28 active:scale-95 backdrop-blur-md border border-white/30 rounded-full py-1 pr-3 pl-1 text-white cursor-pointer transition-all shadow-sm"
            title={t('preferences')}
          >
            <span className="w-6 h-6 rounded-full bg-white text-purple-900 text-[10.5px] font-extrabold flex items-center justify-center shadow-sm">
              {currentUser.initials}
            </span>
            <span className="text-[12.5px] font-bold max-w-[80px] truncate">
              {currentUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-white/80" />
          </button>
        </div>
      </div>

      {/* Signature Curved SVG Wave at Bottom of Header */}
      <svg className="hero-wave-svg" viewBox="0 0 390 26" preserveAspectRatio="none">
        <path d="M0,13 C80,26 160,0 240,13 C320,26 365,6 390,13 L390,26 L0,26 Z" fill="var(--bg)" />
      </svg>
    </header>
  );
}

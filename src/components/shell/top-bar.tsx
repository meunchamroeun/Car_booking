'use client';

import { Bell } from 'lucide-react';
import { useApp } from '@/lib/store';
import { OoneMark } from '@/components/common/logo';
import { Avatar } from '@/components/ui/avatar';

export function TopBar() {
  const { currentUser, unreadNotifsCount, openSheet, setCurrentTab, t } = useApp();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-background/85 px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <OoneMark className="size-[18px]" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight">{t('app_title')}</p>
          <p className="text-[11.5px] font-medium text-muted-foreground">{t(`role_${currentUser.role}`)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => openSheet({ type: 'notifications' })}
          className="relative flex size-10 items-center justify-center rounded-full border bg-card transition-colors hover:bg-muted"
          aria-label={`${t('notifications')}${unreadNotifsCount ? ` (${unreadNotifsCount})` : ''}`}
        >
          <Bell className="size-[18px]" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-white">
              {unreadNotifsCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setCurrentTab('profile')} aria-label={t('nav_profile')} className="rounded-full">
          <Avatar initials={currentUser.initials} seed={currentUser.id} />
        </button>
      </div>
    </header>
  );
}

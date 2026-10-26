'use client';

import { CalendarCheck2, CarFront, ClipboardCheck, History, Home, Route, UserRound, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLE_TABS } from '@/lib/permissions';
import { AppTab } from '@/types';
import { cn } from '@/lib/utils';

const ICONS: Record<AppTab, typeof Home> = {
  home: Home,
  vehicles: CarFront,
  trips: CalendarCheck2,
  history: History,
  tasks: Route,
  approvals: ClipboardCheck,
  fleet: Wrench,
  profile: UserRound,
};

export function BottomNav() {
  const { currentUser, currentTab, setCurrentTab, t, pendingApprovalsCount, myActiveTripsCount, driverTasksCount } = useApp();
  const badges: Partial<Record<AppTab, number>> = {
    approvals: pendingApprovalsCount,
    trips: myActiveTripsCount,
    tasks: driverTasksCount,
  };

  const tabs = ROLE_TABS[currentUser.role].filter(tab => tab !== 'profile');

  return (
    <nav
      aria-label={t('a11y_main_nav')}
      className={cn(
        'fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto px-4',
        tabs.length <= 2 ? 'max-w-[340px]' : tabs.length === 3 ? 'max-w-[380px]' : 'max-w-[420px]'
      )}
    >
      <div className="rounded-full border border-black/[0.06] bg-white py-2 px-5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-md dark:border-white/10 dark:bg-card dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <ul className="flex items-center justify-around">
          {tabs.map(tab => {
            const Icon = ICONS[tab] || Home;
            const active = currentTab === tab;
            const count = badges[tab];
            const label = t(`nav_${tab}`);
            return (
              <li key={tab} className="flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab(tab);
                    window.scrollTo({ top: 0 });
                  }}
                  aria-current={active ? 'page' : undefined}
                  className="group relative flex w-full flex-col items-center justify-center transition-all"
                >
                  <span className="relative flex size-6 items-center justify-center">
                    <Icon
                      className={cn(
                        'size-[22px] transition-all',
                        active ? 'text-primary' : 'text-[#748398] dark:text-[#94a3b8] group-hover:text-foreground'
                      )}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    {!!count && (
                      <span className="absolute -right-2.5 -top-1 flex size-[18px] items-center justify-center rounded-full bg-[#e53935] text-[10px] font-bold text-white shadow-xs">
                        {count}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'mt-1 truncate max-w-[85px] text-[12px] leading-tight transition-colors',
                      active ? 'font-bold text-primary' : 'font-bold text-[#748398] dark:text-[#94a3b8] group-hover:text-foreground'
                    )}
                  >
                    {label}
                  </span>
                  {/* Indicator bar directly under text matching sample */}
                  <span
                    className={cn(
                      'mt-1 h-[3.5px] w-5 rounded-full transition-all duration-200',
                      active ? 'bg-primary scale-100 opacity-100' : 'bg-transparent scale-50 opacity-0'
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

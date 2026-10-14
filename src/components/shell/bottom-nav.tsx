'use client';

import { CalendarCheck2, CarFront, ClipboardCheck, Home, Route, UserRound, Wrench } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLE_TABS } from '@/lib/permissions';
import { AppTab } from '@/types';
import { cn } from '@/lib/utils';

const ICONS: Record<AppTab, typeof Home> = {
  home: Home,
  vehicles: CarFront,
  trips: CalendarCheck2,
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

  return (
    <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t bg-card/90 px-2 pt-1.5 backdrop-blur-lg">
      <ul className="flex">
        {ROLE_TABS[currentUser.role].map(tab => {
          const Icon = ICONS[tab];
          const active = currentTab === tab;
          const count = badges[tab];
          return (
            <li key={tab} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentTab(tab);
                  window.scrollTo({ top: 0 });
                }}
                aria-current={active ? 'page' : undefined}
                className={cn('group flex w-full flex-col items-center gap-0.5 py-1 text-[11px] font-semibold transition-colors', active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                <span className={cn('relative flex h-8 w-14 items-center justify-center rounded-full transition-colors', active && 'bg-primary-soft')}>
                  <Icon className="size-[21px]" strokeWidth={active ? 2.3 : 1.9} />
                  {!!count && (
                    <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9.5px] font-bold text-white">{count}</span>
                  )}
                </span>
                {t(`nav_${tab}`)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

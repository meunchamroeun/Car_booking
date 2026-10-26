'use client';

import { useApp } from '@/lib/store';
import { TopBar } from './top-bar';
import { BottomNav } from './bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { HomeScreen } from '@/components/screens/home';
import { VehiclesScreen } from '@/components/screens/vehicles';
import { TripsScreen } from '@/components/screens/trips';
import { HistoryScreen } from '@/components/screens/history';
import { TasksScreen } from '@/components/screens/tasks';
import { ApprovalsScreen } from '@/components/screens/approvals';
import { FleetScreen } from '@/components/screens/fleet';
import { ProfileScreen } from '@/components/screens/profile';
import { SheetHost } from '@/components/sheets/sheet-host';

const SCREENS = {
  home: HomeScreen,
  vehicles: VehiclesScreen,
  trips: TripsScreen,
  history: HistoryScreen,
  tasks: TasksScreen,
  approvals: ApprovalsScreen,
  fleet: FleetScreen,
  profile: ProfileScreen,
};

export function AppShell() {
  const { currentTab } = useApp();
  const Screen = SCREENS[currentTab];
  return (
    <div className="min-h-dvh bg-muted/40 dark:bg-black/30">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] bg-background sm:border-x sm:shadow-card">
        <TopBar />
        <main key={currentTab} className="animate-in fade-in-0 slide-in-from-bottom-1 px-4 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+24px)] duration-300">
          <Screen />
        </main>
        <BottomNav />
      </div>
      <SheetHost />
      <Toaster />
    </div>
  );
}

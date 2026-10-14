'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { VehiclesView } from '@/components/vehicles/VehiclesView';
import { MyBookingsView } from '@/components/bookings/MyBookingsView';
import { DriverTasksView } from '@/components/driver/DriverTasksView';
import { ApprovalQueueView } from '@/components/approvals/ApprovalQueueView';
import { AdminFleetView } from '@/components/admin/AdminFleetView';

// Modals & Drawers
import { BookingSheetModal } from '@/components/modals/BookingSheetModal';
import { PassSheetModal } from '@/components/modals/PassSheetModal';
import { EarlyReturnModal } from '@/components/modals/EarlyReturnModal';
import { CompleteTaskModal } from '@/components/modals/CompleteTaskModal';
import { MaintenanceModal } from '@/components/modals/MaintenanceModal';
import { ReviewApprovalModal } from '@/components/modals/ReviewApprovalModal';
import { RejectReasonModal } from '@/components/modals/RejectReasonModal';
import { ProfilePreferencesModal } from '@/components/modals/ProfilePreferencesModal';
import { NotificationDrawer } from '@/components/modals/NotificationDrawer';
import { ToastDeck } from '@/components/ui/ToastDeck';

export function AppShell() {
  const { currentTab } = useApp();

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'cars':
        return <VehiclesView />;
      case 'my-trips':
        return <MyBookingsView />;
      case 'driver':
        return <DriverTasksView />;
      case 'approvals':
        return <ApprovalQueueView />;
      case 'more':
        return <AdminFleetView />;
      default:
        return <VehiclesView />;
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-100/60 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased flex justify-center transition-colors"
      suppressHydrationWarning
    >
      {/* Clean Centered Mobile Shell (#app) */}
      <div
        id="app"
        className="w-full max-w-[430px] min-h-screen bg-white dark:bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.06)] dark:shadow-[0_0_60px_rgba(0,0,0,0.6)] border-x border-slate-200/60 dark:border-zinc-800/80 flex flex-col relative overflow-x-hidden pb-[calc(var(--nav-h)+env(safe-area-inset-bottom,12px)+16px)]"
        suppressHydrationWarning
      >
        {/* Header */}
        <Header />

        {/* Main Tab Screen Content */}
        <main id="mobileMain" className="flex-1 overflow-y-auto px-1 py-1" suppressHydrationWarning>
          {renderCurrentTab()}
        </main>

        {/* Floating Pill Dock Navigation */}
        <BottomNav />
      </div>

      {/* Bottom Sheet Modals */}
      <BookingSheetModal />
      <PassSheetModal />
      <EarlyReturnModal />
      <CompleteTaskModal />
      <MaintenanceModal />
      <ReviewApprovalModal />
      <RejectReasonModal />
      <ProfilePreferencesModal />
      <NotificationDrawer />

      {/* Floating Animated Toast Deck */}
      <ToastDeck />
    </div>
  );
}

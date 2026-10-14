'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { AppTab } from '@/types';
import {
  Car as CarIcon,
  FileText,
  Compass,
  CheckSquare,
  Settings,
} from 'lucide-react';

export function BottomNav() {
  const {
    currentTab,
    setCurrentTab,
    currentUser,
    myActiveTripsCount,
    driverTasksCount,
    pendingApprovalsCount,
    t,
  } = useApp();

  const isApproverOrAdmin = currentUser.role === 'Approver' || currentUser.role === 'Admin';

  const tabs: Array<{
    id: AppTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'cars',
      label: t('nav_cars'),
      icon: <CarIcon className="w-5 h-5" />,
    },
    {
      id: 'my-trips',
      label: t('nav_trips'),
      icon: <FileText className="w-5 h-5" />,
      badgeCount: myActiveTripsCount,
    },
    {
      id: 'driver',
      label: currentUser.role === 'Driver' ? t('nav_driver_self') : t('nav_driver'),
      icon: <Compass className="w-5 h-5" />,
      badgeCount: driverTasksCount,
    },
    {
      id: 'approvals',
      label: t('nav_approvals'),
      icon: <CheckSquare className="w-5 h-5" />,
      badgeCount: isApproverOrAdmin ? pendingApprovalsCount : 0,
    },
    {
      id: 'more',
      label: t('nav_admin'),
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="nav-floating-dock">
      <nav className="nav-pill-capsule" aria-label="Main Navigation">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`tab-${tab.id}`}
              onClick={() => {
                setCurrentTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            >
              <div className="nav-tab-icon">
                {tab.icon}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="nav-badge-dot">
                    {tab.badgeCount}
                  </span>
                )}
              </div>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

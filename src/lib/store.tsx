'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppTab, CarType, FleetData, Language, SheetState, ThemeMode, User, ViewMode } from '@/types';
import { getDefaultMockData } from '@/lib/mock-data';
import { I18N_DICTIONARY } from '@/lib/i18n';
import { DateUtil } from '@/lib/date-utils';
import { ROLE_DEFAULT_TAB, ROLE_TABS } from '@/lib/permissions';
import * as svc from '@/lib/fleet-service';
import { getTelegram, haptic, initTelegram, syncTelegramTheme } from '@/lib/telegram';

export interface ToastItem {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'info';
}

type Slot = 'all' | 'morning' | 'afternoon';

interface AppContextType extends FleetData {
  currentUser: User;
  switchUser: (userId: string) => void;

  // Navigation & preferences
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;

  // Vehicle browsing filters
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSlot: Slot;
  setSelectedSlot: (slot: Slot) => void;
  filterType: 'all' | CarType;
  setFilterType: (type: 'all' | CarType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  /** Id of the booking just created — Trips opens on the tab that contains it. */
  lastCreatedId: string | null;

  // Badges
  pendingApprovalsCount: number;
  myActiveTripsCount: number;
  driverTasksCount: number;
  unreadNotifsCount: number;

  // Sheets (one at a time)
  sheet: SheetState;
  openSheet: (s: SheetState) => void;
  closeSheet: () => void;
  openBooking: (carId?: string, start?: string, end?: string, date?: string) => void;

  // Actions — each one maps to an API endpoint (docs/API.md)
  createBooking: (input: svc.CreateBookingInput) => boolean;
  approveBooking: (id: string, driverId: string | null) => boolean;
  rejectBooking: (id: string, reason: string) => boolean;
  cancelBooking: (id: string, reason?: string) => boolean;
  startTask: (id: string) => boolean;
  returnVehicle: (id: string, input: { returnTime: string; odometer?: string; notes?: string }) => boolean;
  setMaintenance: (carId: string, m: Parameters<typeof svc.setMaintenance>[3]) => boolean;
  clearMaintenance: (carId: string) => boolean;
  toggleDriverDuty: (driverId: string) => boolean;
  markNotificationsRead: () => void;
  resetDemoData: () => void;

  // Queries
  isCarInMaintenance: (carId: string, date?: string, start?: string, end?: string) => boolean;
  checkConflict: (carId: string, date: string, start: string, end: string, excludeId?: string, endDate?: string) => ReturnType<typeof svc.checkConflict>;

  toasts: ToastItem[];
  showToast: (msg: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DATA_KEY = 'oone_fleet_data_v5';
const USER_KEY = 'oone_fleet_user_v3';
const THEME_KEY = 'oone_fleet_theme_v3';
const LANG_KEY = 'oone_fleet_lang_v3';

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FleetData>(() => getDefaultMockData());
  const [currentUserId, setCurrentUserId] = useState('u1');
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [lang, setLangState] = useState<Language>('en');

  const [selectedDate, setSelectedDate] = useState(DateUtil.todayStr());
  const [selectedSlot, setSelectedSlot] = useState<Slot>('all');
  const [filterType, setFilterType] = useState<'all' | CarType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sheet, setSheet] = useState<SheetState>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(x => x.id !== id)), []);
  const showToast = useCallback(
    (msg: string, type: ToastItem['type'] = 'info') => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts(prev => [...prev.slice(-2), { id, msg, type }]);
      setTimeout(() => dismissToast(id), 3600);
    },
    [dismissToast]
  );

  // Hydrate from localStorage
  useEffect(() => {
    const tg = initTelegram();
    const th = store.get(THEME_KEY) as ThemeMode | null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    // Inside Telegram, follow the user's Telegram theme unless they picked one in the app
    const initial = th ?? (tg ? tg.colorScheme : prefersDark ? 'dark' : 'light');
    applyTheme(initial);
    setThemeState(initial);

    const lg = store.get(LANG_KEY) as Language | null;
    if (lg) setLangState(lg);

    try {
      const raw = store.get(DATA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FleetData;
        if (parsed.cars && parsed.bookings && parsed.users) setData(parsed);
      }
    } catch {
      /* corrupted — keep defaults */
    }
    const uid = store.get(USER_KEY);
    if (uid) setCurrentUserId(uid);
  }, []);

  const commit = (next: FleetData) => {
    setData(next);
    store.set(DATA_KEY, JSON.stringify(next));
  };

  const currentUser = useMemo(() => data.users.find(u => u.id === currentUserId) ?? data.users[0], [data.users, currentUserId]);

  // Keep the active tab valid for the role
  useEffect(() => {
    if (!ROLE_TABS[currentUser.role].includes(currentTab)) setCurrentTab(ROLE_DEFAULT_TAB[currentUser.role]);
  }, [currentUser.role, currentTab]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = I18N_DICTIONARY[lang]?.[key] ?? I18N_DICTIONARY.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    [lang]
  );

  function applyTheme(th: ThemeMode) {
    syncTelegramTheme(th);
    document.documentElement.setAttribute('data-theme', th);
    document.documentElement.classList.toggle('dark', th === 'dark');
  }

  const setTheme = (th: ThemeMode) => {
    setThemeState(th);
    applyTheme(th);
    store.set(THEME_KEY, th);
  };

  const setLang = (l: Language) => {
    setLangState(l);
    store.set(LANG_KEY, l);
    document.documentElement.lang = l === 'kh' ? 'km' : 'en';
  };

  const switchUser = (userId: string) => {
    const target = data.users.find(u => u.id === userId);
    if (!target) return;
    setCurrentUserId(userId);
    store.set(USER_KEY, userId);
    setSheet(null);
    setCurrentTab(ROLE_DEFAULT_TAB[target.role]);
    window.scrollTo({ top: 0 });
    showToast(t('toast_switched', { name: target.name, role: t(`role_${target.role}`) }), 'info');
  };

  /** Runs a service command; shows its message or error as a toast. */
  const run = (fn: () => { data: FleetData; message: string; bookingId?: string }, close = true): boolean => {
    try {
      const res = fn();
      if (res.bookingId) setLastCreatedId(res.bookingId);
      commit(res.data);
      if (close) setSheet(null);
      showToast(res.message, 'success');
      haptic('success');
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Something went wrong', 'error');
      haptic('error');
      return false;
    }
  };

  // Telegram's native Back button: closes the open sheet, otherwise returns to Home
  useEffect(() => {
    const tg = getTelegram();
    if (!tg || !tg.isVersionAtLeast('6.1')) return;
    const home = ROLE_DEFAULT_TAB[currentUser.role];
    const canGoBack = !!sheet || currentTab !== home;
    const onBack = () => (sheet ? setSheet(null) : setCurrentTab(home));
    if (canGoBack) tg.BackButton.show();
    else tg.BackButton.hide();
    tg.BackButton.onClick(onBack);
    return () => tg.BackButton.offClick(onBack);
  }, [sheet, currentTab, currentUser.role]);

  // Badges
  const pendingApprovalsCount = useMemo(
    () => data.bookings.filter(b => b.status === 'Pending' && !(currentUser.role === 'Approver' && b.requesterId === currentUser.id)).length,
    [data.bookings, currentUser]
  );
  const myActiveTripsCount = useMemo(
    () => data.bookings.filter(b => b.requesterId === currentUser.id && (b.status === 'Pending' || b.status === 'Approved')).length,
    [data.bookings, currentUser.id]
  );
  const driverTasksCount = useMemo(
    () => data.bookings.filter(b => b.driverId && b.driverId === currentUser.driverId && b.status === 'Approved').length,
    [data.bookings, currentUser.driverId]
  );
  const unreadNotifsCount = useMemo(
    () => data.notifications.filter(n => n.userId === currentUser.id && !n.read).length,
    [data.notifications, currentUser.id]
  );

  const isCarInMaintenance = (carId: string, date = selectedDate, start?: string, end?: string) =>
    svc.isCarInMaintenance(data.cars.find(c => c.id === carId), date, start, end);

  const openBooking = (carId?: string, start?: string, end?: string, date?: string) => {
    const d = date ?? selectedDate;
    if (carId && isCarInMaintenance(carId, d, start, end)) {
      showToast(t('toast_in_service'), 'error');
      return;
    }
    setSheet({ type: 'book', carId, start, end, date: d });
  };

  const value: AppContextType = {
    ...data,
    currentUser,
    switchUser,
    currentTab,
    setCurrentTab,
    viewMode,
    setViewMode,
    theme,
    setTheme,
    lang,
    setLang,
    t,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    lastCreatedId,
    pendingApprovalsCount,
    myActiveTripsCount,
    driverTasksCount,
    unreadNotifsCount,
    sheet,
    openSheet: setSheet,
    closeSheet: () => setSheet(null),
    openBooking,

    createBooking: input => {
      const ok = run(() => svc.createBooking(data, currentUser, input));
      if (ok) setCurrentTab(currentUser.role === 'Admin' ? 'home' : 'trips');
      return ok;
    },
    approveBooking: (id, driverId) => run(() => svc.approveBooking(data, currentUser, id, driverId)),
    rejectBooking: (id, reason) => run(() => svc.rejectBooking(data, currentUser, id, reason)),
    cancelBooking: (id, reason) => run(() => svc.cancelBooking(data, currentUser, id, reason)),
    startTask: id => run(() => svc.startTask(data, currentUser, id), false),
    returnVehicle: (id, input) => run(() => svc.returnVehicle(data, currentUser, id, input)),
    setMaintenance: (carId, m) => run(() => svc.setMaintenance(data, currentUser, carId, m)),
    clearMaintenance: carId => run(() => svc.clearMaintenance(data, currentUser, carId)),
    toggleDriverDuty: driverId => run(() => svc.toggleDriverDuty(data, currentUser, driverId), false),
    markNotificationsRead: () =>
      commit({ ...data, notifications: data.notifications.map(n => (n.userId === currentUser.id ? { ...n, read: true } : n)) }),
    resetDemoData: () => {
      commit(getDefaultMockData());
      setSelectedDate(DateUtil.todayStr());
      setSelectedSlot('all');
      setFilterType('all');
      setSearchQuery('');
      showToast(t('toast_reset'), 'success');
    },

    isCarInMaintenance,
    checkConflict: (carId, date, start, end, excludeId, endDate) => svc.checkConflict(data, carId, date, start, end, excludeId, endDate),

    toasts,
    showToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}

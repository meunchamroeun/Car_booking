/**
 * Telegram Mini App bridge (https://core.telegram.org/bots/webapps).
 * The SDK script is loaded in app/layout.tsx. Outside Telegram every helper is a no-op,
 * so the same build works in a normal browser and inside @car_booking_appbot.
 */

type HapticNotice = 'success' | 'error' | 'warning';

interface TelegramWebApp {
  initData: string;
  version: string;
  colorScheme: 'light' | 'dark';
  isVersionAtLeast(v: string): boolean;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  onEvent(event: string, cb: () => void): void;
  offEvent(event: string, cb: () => void): void;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  HapticFeedback: { notificationOccurred(type: HapticNotice): void; selectionChanged(): void };
  initDataUnsafe: { user?: { id: number; first_name: string; last_name?: string; username?: string } };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/** The WebApp object, only when actually running inside Telegram. */
export function getTelegram(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  const wa = window.Telegram?.WebApp;
  return wa && wa.initData ? wa : null;
}

export const isInTelegram = () => !!getTelegram();

/** Match Telegram's header/background to the app theme (hex colours of --background). */
export function syncTelegramTheme(theme: 'light' | 'dark') {
  const tg = getTelegram();
  if (!tg) return;
  const bg = theme === 'dark' ? '#0D111B' : '#F8F6F8';
  try {
    if (tg.isVersionAtLeast('6.1')) {
      tg.setHeaderColor(bg);
      tg.setBackgroundColor(bg);
    }
    if (tg.isVersionAtLeast('7.10')) tg.setBottomBarColor?.(bg);
  } catch {
    /* older clients */
  }
}

export function haptic(type: HapticNotice) {
  const tg = getTelegram();
  try {
    if (tg?.isVersionAtLeast('6.1')) tg.HapticFeedback.notificationOccurred(type);
  } catch {
    /* ignore */
  }
}

/** Call once on start: tell Telegram we're ready and use the full height. */
export function initTelegram() {
  const tg = getTelegram();
  if (!tg) return null;
  tg.ready();
  tg.expand();
  // Sheets are dragged/scrolled vertically; don't let that swipe the Mini App closed.
  if (tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes?.();
  document.documentElement.classList.add('in-telegram');
  return tg;
}

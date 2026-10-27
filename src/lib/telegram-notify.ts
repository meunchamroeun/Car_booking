import type { TelegramNotifyPayload } from '@/app/api/telegram-notify/route';

export type { TelegramNotifyPayload };

/**
 * Non-blocking dispatch to Next.js Telegram notification API route.
 * Fails silently on the client if credentials are not configured or offline.
 */
export function sendTelegramNotification(payload: TelegramNotifyPayload) {
  try {
    fetch('/api/telegram-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(err => {
      // Intentionally quiet so network hiccups don't interfere with user experience
      console.warn('Telegram notification dispatch failed:', err);
    });
  } catch {
    // Ignore client fetch errors
  }
}

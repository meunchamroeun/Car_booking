// Service Worker for OONE Fleet PWA & App Badging
const CACHE_NAME = 'oone-fleet-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification handling
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'OONE Fleet', body: event.data ? event.data.text() : 'New notification' };
  }

  const title = data.title || 'OONE Fleet';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.url || '/',
  };

  const tasks = [self.registration.showNotification(title, options)];

  if ('setAppBadge' in self.navigator && typeof data.badgeCount === 'number') {
    tasks.push(self.navigator.setAppBadge(data.badgeCount).catch(() => {}));
  }

  event.waitUntil(Promise.all(tasks));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

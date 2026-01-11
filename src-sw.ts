/* eslint-disable no-restricted-globals */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL } from 'workbox-precaching';

// self.__WB_MANIFEST will be populated by workbox during build
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();
self.skipWaiting();
(self as any).clientsClaim();

// Navigation fallback for SPA (denylist API routes)
const handler = createHandlerBoundToURL('/');
registerRoute(new NavigationRoute(handler, { denylist: [/^\/api\//] }));

// Cache GET API responses (NetworkFirst)
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })]
  }),
  'GET'
);

// Cache images (CacheFirst)
registerRoute(
  ({ url }) => /\.(?:png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 })]
  }),
  'GET'
);

// Background sync for write requests (POST/PUT/DELETE)
const bgSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60 // minutes
});

['POST', 'PUT', 'DELETE'].forEach((method) => {
  registerRoute(
    ({ url, request }) => url.pathname.startsWith('/api/') && request.method === method,
    new NetworkOnly({ plugins: [bgSyncPlugin] }),
    method
  );
});

// Optional: listen for messages from the page to trigger skipWaiting
self.addEventListener('message', (event: any) => {
  if (event?.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

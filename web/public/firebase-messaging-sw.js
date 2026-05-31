/* Firebase Messaging service worker placeholder.
 * Keep this file for push notification registration.
 * Hook actual Firebase messaging handlers here when SDK config is enabled.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

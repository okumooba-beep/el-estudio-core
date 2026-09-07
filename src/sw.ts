/**
 * Fase 1 (push real). Service worker propio — reemplaza al que
 * `vite-plugin-pwa` autogeneraba con la estrategia 'generateSW' (ver
 * vite.config.ts). Sigue haciendo lo mismo de siempre (precache +
 * navigateFallback a '/index.html', vía Workbox) y además reacciona a los
 * eventos `push`/`notificationclick` reales, que 'generateSW' no permitía
 * escribir.
 *
 * Tipado: este archivo corre en el scope de un Service Worker, no en el
 * DOM — usa su propio tsconfig.sw.json (lib "webworker", sin "dom") para
 * no chocar con el resto de src/ (lib "dom"). Ver tsconfig.json.
 */
/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import type { PrecacheEntry } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | PrecacheEntry)[]
}

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

interface PushPayload {
  title?: string
  body?: string
  url?: string
}

/** Fase 2 va a mandar el mismo shape desde el Edge Function `dispatch-reminders`; Fase 1 solo usa `send-test-push`. */
self.addEventListener('push', (event) => {
  let payload: PushPayload = {}
  if (event.data) {
    try {
      payload = event.data.json() as PushPayload
    } catch {
      payload = { body: event.data.text() }
    }
  }

  const title = payload.title ?? 'El Estudio'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    }),
  )
})

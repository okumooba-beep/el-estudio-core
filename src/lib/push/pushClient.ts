import { supabase } from '@/lib/supabase/client'

/**
 * Fase 1 (push real). Suscripción del navegador a Web Push + guardado en
 * `push_subscriptions` (ver supabase/push_schema.sql) + disparo manual de
 * una notificación de prueba vía el Edge Function `send-test-push`.
 *
 * A diferencia de todo lo que sincroniza en src/lib/sync/, esta tabla no
 * tiene equivalente en Dexie ni motor push/hydrate/migrate — la
 * suscripción nace en el navegador y se sube directo, sin cola offline
 * (ver supabase/push_schema.sql).
 *
 * Vive en src/lib/ (no en un módulo) por la misma razón que
 * src/lib/sync/bootstrap.ts: `module-no-app-tree` en
 * .dependency-cruiser.cjs prohíbe que un módulo (src/modules/**) importe
 * de src/lib directo. App.tsx importa estas funciones y se las pasa a
 * AjustesScreen como props — mismo patrón que `onForceNotesResync`.
 */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type EstadoSuscripcionPush = 'ok' | 'sin-soporte' | 'sin-permiso' | 'sin-vapid-key' | 'error'

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = `${base64}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** Pide permiso, suscribe al navegador y sube la suscripción a Supabase. Idempotente: si ya existe una suscripción del navegador, la reutiliza en vez de crear otra. */
export async function subscribeToPush(userId: string): Promise<EstadoSuscripcionPush> {
  if (!isPushSupported()) return 'sin-soporte'
  if (!VAPID_PUBLIC_KEY) return 'sin-vapid-key'
  if (!supabase) return 'error'

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return 'sin-permiso'

  try {
    const registro = await navigator.serviceWorker.ready
    const suscripcion =
      (await registro.pushManager.getSubscription()) ??
      (await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }))

    const json = suscripcion.toJSON()
    if (!json.keys?.p256dh || !json.keys.auth) return 'error'

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: suscripcion.endpoint,
        p256dh: json.keys.p256dh,
        auth_key: json.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    )
    if (error) {
      console.error('[push] no se pudo guardar la suscripción:', error.message)
      return 'error'
    }
    return 'ok'
  } catch (err) {
    console.error('[push] fallo al suscribirse:', err)
    return 'error'
  }
}

/** Llama al Edge Function `send-test-push`, que le manda una notificación real a todos los endpoints guardados del usuario logueado. */
export async function sendTestPush(): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.functions.invoke('send-test-push')
  if (error) {
    console.error('[push] no se pudo enviar la notificación de prueba:', error.message)
    return false
  }
  return true
}

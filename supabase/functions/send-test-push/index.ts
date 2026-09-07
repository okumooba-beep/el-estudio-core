// Fase 1 (push real) — botón "Mandame una notificación de prueba" de Ajustes.
//
// Corre en Deno (Supabase Edge Functions), no en Node — usa especificadores
// `npm:` (soportados nativamente por el runtime) en vez de depender del
// package.json del frontend. No toca Dexie ni ningún motor de sync: lee
// directo de `push_subscriptions` (ver supabase/push_schema.sql).
//
// Autenticación: recibe el JWT del usuario logueado tal cual llega del
// cliente (`supabase.functions.invoke()` lo agrega solo) y arma el cliente
// de Supabase con la ANON key + ese header — así `auth.uid()` resuelve
// correctamente del lado de Postgres y el RLS de `push_subscriptions` hace
// el filtro por usuario solo, sin necesidad de la service role key acá.
//
// Deploy (con la Supabase CLI ya logueada y con `supabase link` hecho):
//   supabase functions deploy send-test-push
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@email.com
// (las claves VAPID las generó Claude con `web-push generate-vapid-keys` —
// la pública también va en VITE_VAPID_PUBLIC_KEY del frontend, la privada
// SOLO acá, nunca en un archivo VITE_*).
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth_key: string
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Falta el header Authorization.' }), { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Sesión inválida.' }), { status: 401 })
  }

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', userData.user.id)

  if (subsError) {
    return new Response(JSON.stringify({ error: subsError.message }), { status: 500 })
  }
  if (!subs || subs.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No hay ninguna suscripción push guardada para este usuario.' }),
      { status: 404 },
    )
  }

  const payload = JSON.stringify({
    title: 'El Estudio',
    body: 'Notificación de prueba — si ves esto, el push funciona.',
  })

  const resultados = await Promise.allSettled(
    (subs as PushSubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
        )
      } catch (err) {
        // 404/410: el push service dice que el endpoint ya no existe (navegador
        // desuscripto, PWA reinstalada) — la fila queda muerta para siempre si
        // no se limpia acá, y Fase 2 (cron) volvería a fallar contra ella cada
        // minuto.
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        throw err
      }
    }),
  )

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length
  const fallidos = resultados.length - enviados

  return new Response(JSON.stringify({ enviados, fallidos }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

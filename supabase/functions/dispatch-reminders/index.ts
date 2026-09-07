// Fase 2 (push real) — disparo automático de recordatorios vía pg_cron.
//
// A diferencia de send-test-push, nadie invoca esto con un JWT de usuario:
// lo llama pg_cron (server a server, ver supabase/dispatch_reminders_cron.sql)
// una vez por minuto. Por eso usa la service_role key para leer/escribir
// `recordatorios` y `push_subscriptions` sin RLS, en vez de la ANON key +
// Authorization del usuario.
//
// Endurecimiento: SUPABASE_SERVICE_ROLE_KEY es un JWT válido, así que pasa
// la verificación del gateway de Supabase igual que cualquier JWT de
// usuario o la ANON key (que es pública, va en el bundle del cliente). Sin
// una revisión extra acá, cualquiera con la ANON key podría invocar esta
// función manualmente. Por eso se exige que el header Authorization sea
// EXACTAMENTE `Bearer <service_role key>` antes de hacer nada.
//
// Deploy (con la Supabase CLI ya logueada y con `supabase link` hecho):
//   supabase functions deploy dispatch-reminders
// No hace falta `supabase secrets set` de nuevo: VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY y VAPID_SUBJECT ya están seteados a nivel proyecto
// desde Fase 1 (send-test-push), y SUPABASE_SERVICE_ROLE_KEY lo inyecta
// Supabase solo en cada función.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:soporte@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Pasada 1h desde disparar_en sin poder entregar (endpoints muertos,
// navegador offline, etc.), un recordatorio se da por perdido en vez de
// reintentar cada minuto para siempre.
const REINTENTO_LIMITE_MS = 60 * 60 * 1000

// Tope por corrida: si se acumula un backlog grande (ej. el cron estuvo caído
// un rato), evita que una sola invocación tarde tanto que el Edge Function
// time-outee — el resto queda pendiente y lo levanta el próximo ciclo (1 min).
const LOTE_MAXIMO = 100

interface RecordatorioRow {
  id: string
  user_id: string
  titulo: string
  cuerpo: string
  disparar_en: string
}

interface PushSubscriptionRow {
  endpoint: string
  p256dh: string
  auth_key: string
}

async function enviarAUsuario(
  userId: string,
  payload: string,
): Promise<{ enviados: number; fallidos: number }> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return { enviados: 0, fallidos: 0 }

  const resultados = await Promise.allSettled(
    (subs as PushSubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        throw err
      }
    }),
  )

  const enviados = resultados.filter((r) => r.status === 'fulfilled').length
  return { enviados, fallidos: resultados.length - enviados }
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ahora = new Date()

  const { data: recordatorios, error: recordatoriosError } = await supabase
    .from('recordatorios')
    .select('id, user_id, titulo, cuerpo, disparar_en')
    .eq('enviado', false)
    .lte('disparar_en', ahora.toISOString())
    .limit(LOTE_MAXIMO)

  if (recordatoriosError) {
    return new Response(JSON.stringify({ error: recordatoriosError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let procesados = 0
  let enviados = 0
  let reintentados = 0
  let descartados = 0

  for (const recordatorio of (recordatorios ?? []) as RecordatorioRow[]) {
    procesados++
    const payload = JSON.stringify({ title: recordatorio.titulo, body: recordatorio.cuerpo })
    const resultado = await enviarAUsuario(recordatorio.user_id, payload)

    if (resultado.enviados > 0) {
      await supabase
        .from('recordatorios')
        .update({ enviado: true, enviado_en: ahora.toISOString(), updated_at: ahora.toISOString() })
        .eq('id', recordatorio.id)
      enviados++
      continue
    }

    // Nadie recibió nada: o no había ninguna suscripción (fallidos === 0), o
    // todas las suscripciones que había fallaron.
    const vencido =
      ahora.getTime() - new Date(recordatorio.disparar_en).getTime() > REINTENTO_LIMITE_MS

    if (resultado.fallidos === 0 || vencido) {
      // Sin nada que reintentar, o ya pasó 1h reintentando: se da por perdido.
      await supabase
        .from('recordatorios')
        .update({ enviado: true, enviado_en: ahora.toISOString(), updated_at: ahora.toISOString() })
        .eq('id', recordatorio.id)
      descartados++
    } else {
      // Había suscripciones, fallaron, todavía dentro de la ventana de 1h:
      // se deja enviado=false y el próximo ciclo del cron (1 min) reintenta solo.
      reintentados++
    }
  }

  return new Response(JSON.stringify({ procesados, enviados, reintentados, descartados }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

// Fase 6 (IA en el bolsillo) — punto 4/5: inactividad.
//
// Mismo patrón que daily-pending-missions: la invoca pg_cron, server a
// server, con service_role. A diferencia de los otros crons de esta fase
// (una vez por día), este corre cada hora (ver inactivity_check_cron.sql)
// — el umbral pedido es de 3 HORAS de silencio, no de días, así que el
// chequeo necesita esa misma granularidad para poder detectarlo: un cron
// diario no puede resolver un umbral más corto que su propia frecuencia.
//
// Dos umbrales, no uno, para no mandar el mismo recordatorio en cada
// corrida mientras el usuario sigue sin volver:
//   UMBRAL_HORAS   — silencio mínimo para el primer aviso.
//   REAVISO_HORAS  — silencio desde el ÚLTIMO aviso para mandar otro (si
//                     todavía no volvió). Sin este segundo umbral, con un
//                     cron horario alguien que no vuelve nunca recibiría
//                     un push por hora para siempre.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const UMBRAL_HORAS = 3
const REAVISO_HORAS = 3

interface ActividadRow {
  user_id: string
  ultima_apertura: string
  ultimo_aviso_inactividad: string | null
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
  const limiteUmbral = new Date(ahora.getTime() - UMBRAL_HORAS * 60 * 60 * 1000)
  const limiteReaviso = new Date(ahora.getTime() - REAVISO_HORAS * 60 * 60 * 1000)

  const { data: candidatos, error: candidatosError } = await supabase
    .from('actividad_usuarios')
    .select('user_id, ultima_apertura, ultimo_aviso_inactividad')
    .lt('ultima_apertura', limiteUmbral.toISOString())

  if (candidatosError) {
    return new Response(JSON.stringify({ error: candidatosError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let procesados = 0
  let avisados = 0
  const errores: string[] = []

  for (const fila of (candidatos ?? []) as ActividadRow[]) {
    procesados++
    const yaAvisado = fila.ultimo_aviso_inactividad !== null
    if (yaAvisado && new Date(fila.ultimo_aviso_inactividad!) >= limiteReaviso) continue

    try {
      const horasInactivo = Math.floor((ahora.getTime() - new Date(fila.ultima_apertura).getTime()) / (60 * 60 * 1000))

      await supabase.from('recordatorios').insert({
        user_id: fila.user_id,
        origen_tipo: 'inactividad',
        origen_id: null,
        titulo: 'Hace un rato que no pasás por El Estudio',
        cuerpo: `${horasInactivo} horas sin abrir la app. Cuando quieras, todo sigue como lo dejaste.`,
        disparar_en: ahora.toISOString(),
      })

      await supabase
        .from('actividad_usuarios')
        .update({ ultimo_aviso_inactividad: ahora.toISOString(), updated_at: ahora.toISOString() })
        .eq('user_id', fila.user_id)

      avisados++
    } catch (err) {
      errores.push(`${fila.user_id}: ${(err as Error).message}`)
    }
  }

  return new Response(JSON.stringify({ procesados, avisados, errores }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

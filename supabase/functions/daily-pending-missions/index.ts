// Fase 6 (IA en el bolsillo) — punto 3/5: misión pendiente diaria.
//
// Mismo patrón que weekly-reflection: la invoca pg_cron una vez por día
// (9:00 ART — ver daily_pending_missions_cron.sql), server a server, con
// service_role. A diferencia de la alarma manual por misión (origen_tipo
// 'mision', que el cliente arma en src/lib/reminders/recordatorios.ts con
// una hora propia), este es un chequeo automático: no depende de que el
// usuario haya cargado hora en la misión — mira todas las misiones con
// `programada_fecha` de HOY que sigan sin terminar, y si hay alguna manda
// UN solo recordatorio consolidado (no uno por misión).
//
// No hace falta deduplicar entre corridas: el cron corre una vez al día,
// así que a lo sumo inserta una fila por usuario por día. Si la misión
// sigue pendiente mañana, se vuelve a avisar mañana — es el comportamiento
// querido, no un bug (recordatorio diario mientras siga pendiente).
//
// Deploy:
//   supabase functions deploy daily-pending-missions
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface MissionRow {
  texto: string
  estado: string | null
  programada_fecha: string | null
  deleted_at: string | null
}

// Argentina no usa horario de verano: UTC-3 todo el año, mismo criterio
// que weekly-reflection.ts (lunesDe) y weekly_reflection_cron.sql.
function hoyART(): string {
  const ahoraArt = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return ahoraArt.toISOString().slice(0, 10)
}

/** Lista títulos priorizando las de hoy sobre las atrasadas, máx 3. */
function armarCuerpo(deHoy: MissionRow[], atrasadas: MissionRow[]): string {
  const titulos = [...deHoy, ...atrasadas].map((m) => m.texto)
  if (titulos.length <= 3) return titulos.join(', ')
  return `${titulos.slice(0, 3).join(', ')} y ${titulos.length - 3} más`
}

function armarTitulo(deHoy: MissionRow[], atrasadas: MissionRow[]): string {
  if (deHoy.length > 0 && atrasadas.length > 0) {
    return `${deHoy.length} para hoy · ${atrasadas.length} atrasadas`
  }
  if (deHoy.length > 0) return `Tenés ${deHoy.length} misiones para hoy`
  return `Tenés ${atrasadas.length} misiones atrasadas`
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const hoy = hoyART()
  const ahora = new Date().toISOString()

  const { data: usuarios, error: usuariosError } = await supabase
    .from('push_subscriptions')
    .select('user_id')

  if (usuariosError) {
    return new Response(JSON.stringify({ error: usuariosError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userIds = [...new Set((usuarios ?? []).map((u: { user_id: string }) => u.user_id))]

  let procesados = 0
  let avisados = 0
  const errores: string[] = []

  for (const userId of userIds) {
    procesados++
    try {
      const { data: misiones, error: misionesError } = await supabase
        .from('missions')
        .select('texto, estado, programada_fecha, deleted_at')
        .eq('user_id', userId)
        .lte('programada_fecha', hoy)
        .is('deleted_at', null)

      if (misionesError) throw misionesError

      const pendientes = ((misiones ?? []) as MissionRow[]).filter(
        (m) => m.estado !== 'terminada' && m.estado !== 'completada',
      )
      if (pendientes.length === 0) continue

      const deHoy = pendientes.filter((m) => m.programada_fecha === hoy)
      const atrasadas = pendientes.filter((m) => m.programada_fecha !== hoy)

      const cuerpo = armarCuerpo(deHoy, atrasadas)
      const titulo = armarTitulo(deHoy, atrasadas)

      await supabase.from('recordatorios').insert({
        user_id: userId,
        origen_tipo: 'mision_pendiente_diaria',
        origen_id: null,
        titulo,
        cuerpo,
        disparar_en: ahora,
      })

      avisados++
    } catch (err) {
      errores.push(`${userId}: ${(err as Error).message}`)
    }
  }

  return new Response(JSON.stringify({ procesados, avisados, errores }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

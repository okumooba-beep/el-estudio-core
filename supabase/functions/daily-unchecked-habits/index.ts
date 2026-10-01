// Fase 6 (IA en el bolsillo) — punto 5/5: hábito sin marcar.
//
// Mismo patrón que daily-pending-missions: pg_cron una vez por día
// (21:00 ART — ver daily_unchecked_habits_cron.sql), service_role, un
// solo recordatorio consolidado por usuario (no uno por hábito).
//
// "Hábito" no es una entidad propia en el modelo (ver habits_schema.sql):
// es una fila de `ideas` con destino = 'habitos'; la marca del día vive en
// `habit_checks`, referenciada por `habit_id` sin foreign key (mismo
// desacople documentado en habits_schema.sql). Acá se hace el mismo join
// en memoria que HabitosScreen.tsx hace del lado del cliente.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface IdeaRow {
  id: string
  texto: string
}

interface HabitCheckRow {
  habit_id: string
  checked: boolean
}

// Argentina no usa horario de verano: UTC-3 todo el año, mismo criterio
// que daily-pending-missions/index.ts (hoyART).
function hoyART(): string {
  const ahoraArt = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return ahoraArt.toISOString().slice(0, 10)
}

function armarCuerpo(nombres: string[]): string {
  if (nombres.length <= 3) return nombres.join(', ')
  return `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`
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
      const { data: habitos, error: habitosError } = await supabase
        .from('ideas')
        .select('id, texto')
        .eq('user_id', userId)
        .eq('destino', 'habitos')
        .is('deleted_at', null)

      if (habitosError) throw habitosError
      const habitosRow = (habitos ?? []) as IdeaRow[]
      if (habitosRow.length === 0) continue

      const { data: checks, error: checksError } = await supabase
        .from('habit_checks')
        .select('habit_id, checked')
        .eq('user_id', userId)
        .eq('fecha', hoy)

      if (checksError) throw checksError
      const marcadosHoy = new Set(
        ((checks ?? []) as HabitCheckRow[]).filter((c) => c.checked).map((c) => c.habit_id),
      )

      const sinMarcar = habitosRow.filter((h) => !marcadosHoy.has(h.id))
      if (sinMarcar.length === 0) continue

      const cuerpo = armarCuerpo(sinMarcar.map((h) => h.texto))
      const titulo =
        sinMarcar.length === 1 ? 'Todavía no marcaste un hábito hoy' : `Todavía no marcaste ${sinMarcar.length} hábitos hoy`

      await supabase.from('recordatorios').insert({
        user_id: userId,
        origen_tipo: 'habito_sin_marcar',
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

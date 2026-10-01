// Fase 6 (IA en el bolsillo) — punto 2/5: reflexión semanal con IA.
//
// Mismo patrón que dispatch-reminders: la invoca pg_cron, server a
// server, una vez por semana (domingo 12:00 ART — ver
// weekly_reflection_cron.sql), así que usa service_role para leer/escribir
// sin RLS y exige `Authorization: Bearer <service_role key>` exacto antes
// de hacer nada.
//
// A diferencia de dispatch-reminders, esta función NO manda el push ella
// misma: solo guarda la nota en `reflexiones_semanales` e inserta una fila
// en `recordatorios` (origen_tipo = 'reflexion_semanal') — el cron de
// dispatch-reminders que ya corre cada minuto la despacha sola. Ver
// reflexiones_semanales_schema.sql y recordatorios_add_origenes_ia.sql.
//
// Deploy:
//   supabase functions deploy weekly-reflection
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface MissionRow {
  estado: string | null
  deleted_at: string | null
}

interface HabitIdeaRow {
  id: string
}

interface HabitCheckRow {
  habit_id: string
  fecha: string
  checked: boolean
}

interface MovimientoRow {
  tipo: string
  monto: number
  categoria: string | null
  fecha: string
  cuota_total: number | null
  gasto_fijo_id: string | null
}

// ART es UTC-3 todo el año (Argentina no usa horario de verano, ver
// weekly_reflection_cron.sql) — fijo, nunca varía con la fecha.
const ART_OFFSET_MS = 3 * 60 * 60 * 1000

/**
 * Instante UTC real de la medianoche ART del lunes de la semana que
 * contiene `fecha`, en vez de la medianoche UTC — mismo criterio de
 * semana que HabitosScreen.tsx (fechasSemanaActual: lunes a domingo),
 * pero en el día del calendario de Buenos Aires. Bug reportado
 * (2026-10-01): calcular el lunes con getUTCDay()/getUTCDate() directo
 * sobre `fecha` usaba el día UTC, no el día ART — a las 21:00-23:59 ART
 * ya es el día siguiente en UTC, así que cerca de esa franja el corte de
 * semana quedaba corrido respecto del calendario real. Restar el offset
 * antes de leer año/mes/día/día-de-semana da el calendario ART; sumarlo
 * de vuelta al final devuelve el instante UTC real que corresponde a esa
 * medianoche ART, comparable directo contra `fecha` (timestamptz).
 */
function lunesDe(fecha: Date): Date {
  const art = new Date(fecha.getTime() - ART_OFFSET_MS)
  const dia = art.getUTCDay()
  const offset = dia === 0 ? -6 : 1 - dia
  const lunesArt = new Date(Date.UTC(art.getUTCFullYear(), art.getUTCMonth(), art.getUTCDate()))
  lunesArt.setUTCDate(lunesArt.getUTCDate() + offset)
  return new Date(lunesArt.getTime() + ART_OFFSET_MS)
}

function isoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

// Bug reportado (2026-10-01): la nota de Finanzas comparaba "gastaste $X
// esta semana vs. $Y la semana pasada" sobre el total crudo, que mezcla
// pagos de tarjeta/cuotas/alquiler/servicios (compromisos programados,
// no una variación real) con gasto discrecional (lo único donde una
// suba semana contra semana es un hallazgo real) — el resultado era
// relleno ("gastaste un poco menos... y todo fue en tarjeta de
// crédito"). Categorías de pago fijo por naturaleza (tarjeta, alquiler,
// servicios) + cualquier movimiento marcado como cuota o gasto fijo
// (cuota_total/gasto_fijo_id no nulos, sea cual sea su categoría) se
// tratan como "no discrecional" — nunca se comparan ni se mencionan
// como hallazgo (ver generarNotas).
const CATEGORIAS_NO_DISCRECIONALES = new Set(['tarjeta_credito', 'alquiler', 'servicios'])

function esNoDiscrecional(m: MovimientoRow): boolean {
  return m.cuota_total != null || m.gasto_fijo_id != null || CATEGORIAS_NO_DISCRECIONALES.has(m.categoria ?? '')
}

function sumaGastos(
  movimientos: MovimientoRow[],
  desde: Date,
  hasta: Date,
): { total: number; porCategoriaDiscrecional: Map<string, number>; discrecional: number; noDiscrecional: number } {
  const porCategoriaDiscrecional = new Map<string, number>()
  let total = 0
  let discrecional = 0
  let noDiscrecional = 0
  for (const m of movimientos) {
    if (m.tipo !== 'egreso') continue
    const f = new Date(m.fecha)
    if (f < desde || f >= hasta) continue
    const monto = Number(m.monto)
    total += monto
    if (esNoDiscrecional(m)) {
      noDiscrecional += monto
    } else {
      discrecional += monto
      const cat = m.categoria ?? 'sin categoría'
      porCategoriaDiscrecional.set(cat, (porCategoriaDiscrecional.get(cat) ?? 0) + monto)
    }
  }
  return { total, porCategoriaDiscrecional, discrecional, noDiscrecional }
}

async function calcularMetricas(userId: string, inicioSemana: Date) {
  const finSemana = new Date(inicioSemana)
  finSemana.setUTCDate(finSemana.getUTCDate() + 7)
  // Las 4 semanas previas a la actual (nunca la semana en curso, para no
  // promediar un gasto discrecional contra sí mismo) dan la base real de
  // "subió mucho" que pide generarNotas — sin esto la IA no tenía con qué
  // comparar y lo hubiera inventado.
  const inicioPromedio = new Date(inicioSemana)
  inicioPromedio.setUTCDate(inicioPromedio.getUTCDate() - 28)

  // Misiones: completadas en la semana, contra las que quedaron sin
  // terminar — mismos dos valores de estado que seleccionarPrincipales.ts.
  const { data: misiones, error: misionesError } = await supabase
    .from('missions')
    .select('estado, deleted_at')
    .eq('user_id', userId)
    .gte('updated_at', inicioSemana.toISOString())
    .lt('updated_at', finSemana.toISOString())
  if (misionesError) throw misionesError
  const misionesRow = (misiones ?? []) as MissionRow[]
  const misionesCompletadas = misionesRow.filter(
    (m) => !m.deleted_at && (m.estado === 'terminada' || m.estado === 'completada'),
  ).length
  const misionesTotal = misionesRow.filter((m) => !m.deleted_at).length

  // Hábitos: misma fórmula que HabitosScreen.tsx (completadas / (hábitos × 7)).
  const { data: habitosIdeas, error: habitosIdeasError } = await supabase
    .from('ideas')
    .select('id')
    .eq('user_id', userId)
    .eq('destino', 'habitos')
    .is('deleted_at', null)
  if (habitosIdeasError) throw habitosIdeasError
  const habitIds = new Set((habitosIdeas ?? []).map((h: HabitIdeaRow) => h.id))

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana)
    d.setUTCDate(d.getUTCDate() + i)
    return isoFecha(d)
  })
  const diasSemanaSet = new Set(diasSemana)

  const { data: checks, error: checksError } = await supabase
    .from('habit_checks')
    .select('habit_id, fecha, checked')
    .eq('user_id', userId)
    .in('fecha', diasSemana)
  if (checksError) throw checksError
  const checksRow = (checks ?? []) as HabitCheckRow[]
  const completadasHabitos = checksRow.filter(
    (c) => c.checked && diasSemanaSet.has(c.fecha) && habitIds.has(c.habit_id),
  ).length
  const totalCeldas = habitIds.size * 7
  const porcentajeHabitos = totalCeldas > 0 ? Math.round((completadasHabitos / totalCeldas) * 100) : null

  // Finanzas: gasto discrecional por categoría de esta semana, más el
  // promedio de esa misma categoría en las 4 semanas previas (ver
  // sumaGastos/esNoDiscrecional) — el rango de la consulta ahora cubre
  // esas 4 semanas además de la actual.
  // Bug reportado (tras 3c8aa6c): el select nunca revisaba `error` — al
  // sumar `gasto_fijo_id` (depende de una migración manual, igual que
  // `nota` hoy) una falla silenciosa dejaba `data` undefined, caía a
  // `[]` y mostraba "no gastaste nada" en las dos semanas aunque hubiera
  // egresos reales. Ahora cualquier error de estas 4 consultas se
  // propaga y queda en `errores`, nunca disfrazado de "cero gastos".
  // Bug reportado (2026-10-01): "$54.167 esta semana" en vez de los
  // $549.000 reales — faltaba `lte fecha <= ahora`, así que una cuota ya
  // cargada con fecha futura (programada, todavía no ocurrida) podía
  // colarse en el rango de la semana sin haber pasado de verdad todavía.
  const ahoraIso = new Date().toISOString()
  const { data: movimientos, error: movimientosError } = await supabase
    .from('finance_movimientos')
    .select('tipo, monto, categoria, fecha, cuota_total, gasto_fijo_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('fecha', inicioPromedio.toISOString())
    .lt('fecha', finSemana.toISOString())
    .lte('fecha', ahoraIso)
  if (movimientosError) throw movimientosError
  const movimientosRow = (movimientos ?? []) as MovimientoRow[]
  const { discrecional: gastoSemanaDiscrecional, noDiscrecional: gastoSemanaNoDiscrecional, porCategoriaDiscrecional } = sumaGastos(
    movimientosRow,
    inicioSemana,
    finSemana,
  )
  const { porCategoriaDiscrecional: porCategoria4Semanas } = sumaGastos(movimientosRow, inicioPromedio, inicioSemana)
  const promedioPorCategoriaDiscrecional = new Map(
    [...porCategoria4Semanas].map(([categoria, monto]) => [categoria, monto / 4]),
  )

  return {
    misiones: { completadas: misionesCompletadas, total: misionesTotal },
    habitos: { completadas: completadasHabitos, totalCeldas, porcentaje: porcentajeHabitos },
    finanzas: {
      gastoSemanaDiscrecional,
      gastoSemanaNoDiscrecional,
      porCategoriaDiscrecional: Object.fromEntries(porCategoriaDiscrecional),
      promedioPorCategoriaDiscrecional: Object.fromEntries(promedioPorCategoriaDiscrecional),
    },
  }
}

type Metricas = Awaited<ReturnType<typeof calcularMetricas>>

function formatMonto(monto: number): string {
  return `$ ${Math.round(monto).toLocaleString('es-AR')}`
}

async function generarNotas(metricas: Metricas): Promise<{ misiones: string; habitos: string; finanzas: string }> {
  const porCategoriaFormateado = Object.fromEntries(
    Object.entries(metricas.finanzas.porCategoriaDiscrecional).map(([categoria, monto]) => [categoria, formatMonto(monto)]),
  )
  const promedioFormateado = Object.fromEntries(
    Object.entries(metricas.finanzas.promedioPorCategoriaDiscrecional).map(([categoria, monto]) => [categoria, formatMonto(monto)]),
  )

  const prompt = `Sos la voz interna de "El Estudio", una app personal de organización. Generá hasta 3 notas (misiones, hábitos, finanzas), en español, tono cercano y directo, sin emojis. Basate SOLO en estos números reales, no inventes nada.

Reglas estrictas:
- Máximo 2 frases cortas por nota.
- Escribí algo solo si hay un dato concreto y útil: un cambio real, un patrón, un monto relevante.
- Prohibido: frases motivacionales, generalidades, o decir lo obvio (ej. "no hay movimientos para analizar").
- Si no hay nada relevante que decir en un espacio, devolvé exactamente "" (string vacío) para ese campo — no inventes algo para llenarlo.
- Los montos van exactamente como vienen dados acá, sin reformatearlos.
- Para finanzas en particular: los pagos de tarjeta, cuotas y gastos fijos son compromisos programados: no los compares semana contra semana ni los menciones como hallazgo. Analizá solo el gasto discrecional. Hablá solo si hay algo accionable: una categoría discrecional que subió mucho respecto de su promedio, un gasto atípico grande, o ritmo de gasto del mes que comprometa los ingresos. Si no hay nada así, devolvé exactamente "" para ese campo.

Misiones: ${metricas.misiones.completadas} completadas de ${metricas.misiones.total} esta semana.
Hábitos: ${metricas.habitos.completadas} de ${metricas.habitos.totalCeldas} prácticas marcadas${metricas.habitos.porcentaje !== null ? ` (${metricas.habitos.porcentaje}%)` : ' (sin hábitos cargados)'}.
Finanzas — gasto discrecional de esta semana por categoría: ${JSON.stringify(porCategoriaFormateado)}. Promedio de las últimas 4 semanas por esa misma categoría: ${JSON.stringify(promedioFormateado)}. (Aparte, ${formatMonto(metricas.finanzas.gastoSemanaNoDiscrecional)} en pagos de tarjeta/cuotas/alquiler/servicios esta semana — esperable, no lo compares ni lo menciones.)

Devolvé SOLO un JSON válido con esta forma exacta, sin texto alrededor:
{"misiones": "...", "habitos": "...", "finanzas": "..."}`

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!resp.ok) {
    throw new Error(`Anthropic API error: ${resp.status} ${await resp.text()}`)
  }

  const data = await resp.json()
  // content puede traer bloques de tipo "thinking" antes del bloque de
  // texto real — no asumir que content[0] es el texto, buscar el primer
  // bloque type === "text" explícitamente.
  const bloqueTexto = (data.content ?? []).find((b: { type: string; text?: string }) => b.type === 'text')
  const texto = bloqueTexto?.text ?? '{}'
  const match = texto.match(/\{[\s\S]*\}/)
  const json = JSON.parse(match ? match[0] : texto)
  return {
    misiones: String(json.misiones ?? ''),
    habitos: String(json.habitos ?? ''),
    finanzas: String(json.finanzas ?? ''),
  }
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Bug reportado (2026-10-01): este -7 asumía que el cron corría recién
  // el lunes, después de que la semana Mon-Sun ya había cerrado del todo
  // — pero el cron siempre disparó un domingo (12:00 ART antes, 21:00 ART
  // ahora, ver weekly_reflection_cron.sql), que todavía es parte de la
  // semana en curso, no la que "recién terminó". Con el -7 de más, la
  // reflexión miraba la semana anterior a la real y se perdía todo lo
  // cargado en los propios días de la semana en curso (el caso reportado:
  // un pago de tarjeta de $549.000 del domingo quedaba afuera). Sin el
  // -7, inicioSemana es el lunes de la semana que está terminando hoy.
  const ahora = new Date()
  const inicioSemana = lunesDe(ahora)

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
  let generados = 0
  const errores: string[] = []

  for (const userId of userIds) {
    procesados++
    try {
      const metricas = await calcularMetricas(userId, inicioSemana)
      const notas = await generarNotas(metricas)

      const { data: fila, error: insertError } = await supabase
        .from('reflexiones_semanales')
        .upsert(
          {
            user_id: userId,
            semana_inicio: isoFecha(inicioSemana),
            nota_misiones: notas.misiones,
            nota_habitos: notas.habitos,
            nota_finanzas: notas.finanzas,
            metricas,
          },
          { onConflict: 'user_id,semana_inicio' },
        )
        .select('id')
        .single()

      if (insertError) throw insertError

      await supabase.from('recordatorios').insert({
        user_id: userId,
        origen_tipo: 'reflexion_semanal',
        origen_id: fila?.id ?? null,
        titulo: 'Tu reflexión semanal está lista',
        cuerpo: notas.misiones || 'Revisá cómo te fue esta semana.',
        disparar_en: ahora.toISOString(),
      })

      generados++
    } catch (err) {
      errores.push(`${userId}: ${(err as Error).message}`)
    }
  }

  return new Response(JSON.stringify({ procesados, generados, errores }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

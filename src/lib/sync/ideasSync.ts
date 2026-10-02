import { db, IDEAS_SYNC_DESTINOS } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { markSynced } from './pendingSync'
import { eventBus } from '@shared-kernel/events/AppEvents'
import type { Idea, IdeaDestino } from '@/types/idea'
import type { FurnitureId, HistoryEntry } from '@world/studio/furniture'

/**
 * Fase 4 (sync Supabase) — cuarto módulo: Asuntos + Biblioteca. Mismo
 * patrón que missionsSync.ts: ninguno de los dos tiene tabla Dexie propia,
 * son filas de `db.ideas` (src/types/idea.ts) con `destino IN ('asuntos',
 * 'biblioteca')` — la misma tabla que usan Hoy, Misiones, Hábitos, Trading,
 * Agenda y Archivo. Toda lectura/escritura filtra esos destinos
 * explícitamente, para no subir ni pisar datos de otro destino (ver
 * supabase/ideas_schema.sql para el DDL real y por qué acá conviene una
 * tabla única en vez de una por destino, a diferencia de Misiones).
 *
 * 'habitos' y 'agenda' se suman acá en Fase 4: la definición de un hábito
 * (el nombre que ve HabitosScreen.tsx) y una captura de Agenda todavía no
 * convertida en AgendaEvento son, igual que Asuntos/Biblioteca, filas de
 * `db.ideas` sin tabla propia — sin sincronizarlas, la lista de hábitos y
 * las capturas pendientes de Agenda no viajan entre dispositivos (ver
 * supabase/ideas_add_habitos_agenda.sql). habitsSync.ts/agendaSync.ts solo
 * cubren sus tablas dedicadas (habitChecks / agendaEventos+agendaBloques),
 * nunca estas Ideas.
 *
 * 'hoy' y 'archivo' (Umbral + Cuaderno) se suman después, con dos piezas
 * propias: tombstone al mudar una hoja fuera de esta tabla (ver
 * Idea.tombstoneIdeas) y pull incremental (`pullDiarioIncremental`), porque
 * el Cuaderno sí se escribe en paralelo desde más de un dispositivo. El
 * last-write-wins lo garantiza el trigger `ideas_lww` en Supabase (ver
 * supabase/ideas_add_hoy_archivo.sql): un upsert con `updated_at` más viejo
 * que el guardado se ignora.
 */
const IDEAS_DESTINOS = IDEAS_SYNC_DESTINOS
const DIARIO_DESTINOS: readonly IdeaDestino[] = ['hoy', 'archivo']
/** Solapamiento del pull: `updated_at` lo pone el reloj de cada dispositivo, no el servidor. */
const PULL_MARGEN_MS = 10 * 60_000

interface IdeaRow {
  id: string
  user_id: string
  destino: IdeaDestino
  texto: string
  fecha: string
  hora: string
  origen: IdeaDestino
  estado: string | null
  prioridad: 'normal' | 'importante' | null
  contraparte: string | null
  current_furniture: FurnitureId
  history: HistoryEntry[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const SUPABASE_TABLE = 'ideas'

function toRow(userId: string, idea: Idea): IdeaRow {
  return {
    id: idea.id,
    user_id: userId,
    destino: idea.destino,
    texto: idea.texto,
    fecha: idea.fecha,
    hora: idea.hora,
    origen: idea.origen,
    estado: idea.estado,
    prioridad: idea.prioridad ?? null,
    contraparte: idea.contraparte ?? null,
    current_furniture: idea.currentFurniture,
    history: [...idea.history],
    created_at: idea.createdAt,
    updated_at: idea.updatedAt,
    deleted_at: idea.deletedAt ?? null,
  }
}

function fromRow(row: IdeaRow): Idea {
  return {
    id: row.id,
    texto: row.texto,
    fecha: row.fecha,
    hora: row.hora,
    destino: row.destino,
    origen: row.origen,
    estado: row.estado,
    ...(row.prioridad ? { prioridad: row.prioridad } : {}),
    ...(row.contraparte ? { contraparte: row.contraparte } : {}),
    currentFurniture: row.current_furniture,
    history: row.history,
    // Postgres devuelve '…+00:00'; Dexie y el resto del código comparan
    // estos campos como strings ISO 'Z' — se normalizan al mismo formato.
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }
}

async function readIdeasPendientes(): Promise<Idea[]> {
  return db.ideas
    .where('destino')
    .anyOf(IDEAS_DESTINOS)
    .filter((idea) => idea.pendingSync)
    .toArray()
}

export async function allIdeasEmpty(): Promise<boolean> {
  const count = await db.ideas.where('destino').anyOf(IDEAS_DESTINOS).count()
  return count === 0
}

/** Sube todo lo que quedó marcado `pendingSync: true` en los destinos de esta tabla. Se llama cada vez que hay conexión y sesión activa. */
export async function pushIdeasPending(userId: string): Promise<void> {
  if (!supabase) return
  const pendientes = await readIdeasPendientes()
  if (pendientes.length > 0) {
    const rows = pendientes.map((idea) => toRow(userId, idea))
    const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error(`[sync] push falló en ${SUPABASE_TABLE}:`, error.message)
      return
    }
    await markSynced(
      db.ideas,
      pendientes.map((idea) => idea.id),
    )
  }
  await pushIdeasTombstones()
}

/**
 * Hojas mudadas a un destino que no viaja en esta tabla (ver
 * Idea.tombstoneIdeas): la fila remota se marca borrada, nunca se toca su
 * contenido. Solo se limpia el flag — `pendingSync` de esas hojas es de
 * otro sync (p. ej. missionsSync) y no se toca. Si la hoja nunca llegó a
 * subirse, el update no afecta ninguna fila y el flag igual se limpia.
 */
async function pushIdeasTombstones(): Promise<void> {
  if (!supabase) return
  const marcadas = await db.ideas.filter((idea) => idea.tombstoneIdeas === true).toArray()
  if (marcadas.length === 0) return
  const ids = marcadas.map((idea) => idea.id)
  const ahora = new Date().toISOString()
  const { error } = await supabase
    .from(SUPABASE_TABLE)
    .update({ deleted_at: ahora, updated_at: ahora })
    .in('id', ids)
  if (error) {
    console.error(`[sync] tombstone falló en ${SUPABASE_TABLE}:`, error.message)
    return
  }
  await db.ideas
    .where('id')
    .anyOf(ids)
    .filter((idea) => idea.tombstoneIdeas === true && !IDEAS_DESTINOS.includes(idea.destino))
    .modify({ tombstoneIdeas: false })
}

/**
 * Merge de filas remotas sobre Dexie, solo para Umbral + Cuaderno (fila
 * remota o copia local en 'hoy'/'archivo' — cubre mudanzas entre destinos
 * en cualquier sentido). Last-write-wins por `updated_at`, igual que el
 * trigger del servidor: la copia local gana si es igual o más nueva (p. ej.
 * una edición pendiente que todavía no subió). Una hoja mudada localmente
 * fuera de esta tabla tampoco se pisa: manda su tombstone.
 */
async function aplicarRemotasDiario(rows: IdeaRow[]): Promise<number> {
  if (rows.length === 0) return 0
  const locales = await db.ideas.bulkGet(rows.map((row) => row.id))
  const aPoner: Idea[] = []
  rows.forEach((row, i) => {
    const local = locales[i]
    const esDiario = DIARIO_DESTINOS.includes(row.destino) || (local ? DIARIO_DESTINOS.includes(local.destino) : false)
    if (!esDiario) return
    if (!local) {
      if (!row.deleted_at) aPoner.push(fromRow(row))
      return
    }
    if (!IDEAS_DESTINOS.includes(local.destino)) return
    if (Date.parse(local.updatedAt) >= Date.parse(row.updated_at)) return
    aPoner.push(fromRow(row))
  })
  if (aPoner.length > 0) await db.ideas.bulkPut(aPoner)
  return aPoner.length
}

let pullEnCurso = false

/**
 * Pull incremental de Umbral + Cuaderno: trae solo lo que cambió en
 * Supabase desde el último pull (con un margen de solapamiento — el merge
 * es idempotente). Sin `lastPulledAt` (primera vez en este dispositivo)
 * trae todo y lo mezcla con lo local: no hace falta una rama
 * hidratar/migrar aparte, la v26 de Dexie ya dejó lo local pendiente de
 * subir. Devuelve `false` si no pudo completar el pull.
 */
export async function pullDiarioIncremental(userId: string): Promise<boolean> {
  if (!supabase || pullEnCurso) return false
  pullEnCurso = true
  try {
    const meta = await db.syncMeta.get('diario-sync')
    if (meta && meta.userId !== userId) {
      console.warn('[sync] syncMeta (umbral/cuaderno) pertenece a otro usuario — no se hace pull.')
      return false
    }
    const desde = meta?.lastPulledAt
    let query = supabase.from(SUPABASE_TABLE).select('*').eq('user_id', userId)
    if (desde) query = query.gt('updated_at', new Date(Date.parse(desde) - PULL_MARGEN_MS).toISOString())
    const { data, error } = await query
    if (error) {
      console.error(`[sync] pull falló en ${SUPABASE_TABLE}:`, error.message)
      return false
    }
    const rows = (data ?? []) as IdeaRow[]
    const aplicadas = await aplicarRemotasDiario(rows)
    let maximo = desde ? Date.parse(desde) : 0
    for (const row of rows) maximo = Math.max(maximo, Date.parse(row.updated_at))
    await db.syncMeta.put({
      id: 'diario-sync',
      userId,
      migratedAt: meta?.migratedAt ?? new Date().toISOString(),
      migratedTables: [SUPABASE_TABLE],
      ...(maximo > 0 ? { lastPulledAt: new Date(maximo).toISOString() } : {}),
    })
    if (aplicadas > 0) eventBus.emit('ideas.pulled', { count: aplicadas })
    return true
  } finally {
    pullEnCurso = false
  }
}

/**
 * Dispositivo nuevo / reinstalación: Dexie no tiene Asuntos/Biblioteca
 * locales pero la cuenta puede tener datos reales en Supabase. Devuelve
 * las tablas realmente confirmadas (mismo contrato que
 * migrateIdeasOnFirstLogin) — el llamador usa esto para saber si puede
 * marcar la migración completa o si tiene que reintentar en el próximo
 * inicio.
 */
export async function hydrateIdeasFromSupabase(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(SUPABASE_TABLE).select('*').eq('user_id', userId)
  if (error) {
    console.error(`[sync] hidratación falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  if (data && data.length > 0) {
    const ideas = data.map((row) => fromRow(row as IdeaRow))
    await db.ideas.bulkPut(ideas)
    eventBus.emit('ideas.pulled', { count: ideas.length })
  }
  return [SUPABASE_TABLE]
}

/** Primer login con Asuntos/Biblioteca locales previas (creadas sin sesión): sube todo lo que ya existe en Dexie con esos destinos. */
export async function migrateIdeasOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const locales = await db.ideas.where('destino').anyOf(IDEAS_DESTINOS).toArray()
  if (locales.length === 0) return [SUPABASE_TABLE]
  const rows = locales.map((idea) => toRow(userId, idea))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] migración falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  await markSynced(
    db.ideas,
    locales.map((idea) => idea.id),
  )
  return [SUPABASE_TABLE]
}

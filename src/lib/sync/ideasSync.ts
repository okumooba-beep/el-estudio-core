import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { markSynced } from './pendingSync'
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
 * 'hoy' queda deliberadamente fuera de `IDEAS_DESTINOS`: no tiene
 * mecanismo de borrado real (usa moveSheet a 'archivador') y arrastra el
 * módulo Diario, fuera de alcance de este sprint.
 */
const IDEAS_DESTINOS: readonly IdeaDestino[] = ['asuntos', 'biblioteca', 'habitos', 'agenda']

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

/** Sube todo lo que quedó marcado `pendingSync: true` entre Asuntos y Biblioteca. Se llama cada vez que hay conexión y sesión activa. */
export async function pushIdeasPending(userId: string): Promise<void> {
  if (!supabase) return
  const pendientes = await readIdeasPendientes()
  if (pendientes.length === 0) return
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

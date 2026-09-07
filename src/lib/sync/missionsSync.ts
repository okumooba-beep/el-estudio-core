import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { markSynced } from './pendingSync'
import type { Idea, IdeaDestino, Subtarea } from '@/types/idea'
import type { FurnitureId, HistoryEntry } from '@world/studio/furniture'

/**
 * Fase 4 (sync Supabase) — tercer módulo, patrón distinto al de
 * financeSync.ts/notesSync.ts: una misión no tiene tabla Dexie propia,
 * es una fila de `db.ideas` (src/types/idea.ts) con `destino ===
 * 'misiones'` — la misma tabla que usan Hoy, Asuntos, Hábitos, Trading,
 * Agenda, Biblioteca y Archivo. Por eso este motor nunca opera sobre
 * `db.ideas` entera: toda lectura/escritura filtra `destino ===
 * 'misiones'` explícitamente, para no subir ni pisar datos de otro
 * destino (ver supabase/missions_schema.sql para el DDL real y la
 * justificación de por qué la tabla remota tiene columnas propias en
 * vez de espejar `ideas` completa).
 *
 * `pendingSync` (igual que en Finanzas/Notas) no está indexado, así que
 * leer "lo pendiente" ya era un filtro sobre la colección — acá se
 * combina con el filtro de `destino`, nunca se reusa `readPending` de
 * pendingSync.ts tal cual (leería pendientes de todos los destinos).
 * `markSynced` sí se reusa sin cambios: solo actualiza por id, no le
 * importa a qué destino pertenece cada fila.
 */

interface MissionRow {
  id: string
  user_id: string
  texto: string
  fecha: string
  hora: string
  origen: IdeaDestino
  estado: string | null
  programada_fecha: string | null
  programada_hora: string | null
  mision_principal: boolean
  subtareas: Subtarea[]
  current_furniture: FurnitureId
  history: HistoryEntry[]
  created_at: string
  updated_at: string
  deleted_at: string | null
}

const SUPABASE_TABLE = 'missions'

function toRow(userId: string, idea: Idea): MissionRow {
  return {
    id: idea.id,
    user_id: userId,
    texto: idea.texto,
    fecha: idea.fecha,
    hora: idea.hora,
    origen: idea.origen,
    estado: idea.estado,
    programada_fecha: idea.programadaFecha ?? null,
    programada_hora: idea.programadaHora ?? null,
    mision_principal: idea.misionPrincipal ?? false,
    subtareas: idea.subtareas ?? [],
    current_furniture: idea.currentFurniture,
    history: [...idea.history],
    created_at: idea.createdAt,
    updated_at: idea.updatedAt,
    deleted_at: idea.deletedAt ?? null,
  }
}

function fromRow(row: MissionRow): Idea {
  return {
    id: row.id,
    texto: row.texto,
    fecha: row.fecha,
    hora: row.hora,
    destino: 'misiones',
    origen: row.origen,
    estado: row.estado,
    ...(row.programada_fecha ? { programadaFecha: row.programada_fecha } : {}),
    ...(row.programada_hora ? { programadaHora: row.programada_hora } : {}),
    misionPrincipal: row.mision_principal,
    subtareas: row.subtareas,
    currentFurniture: row.current_furniture,
    history: row.history,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }
}

async function readMisionesPendientes(): Promise<Idea[]> {
  return db.ideas
    .where('destino')
    .equals('misiones' satisfies IdeaDestino)
    .filter((idea) => idea.pendingSync)
    .toArray()
}

export async function allMissionsEmpty(): Promise<boolean> {
  const count = await db.ideas.where('destino').equals('misiones' satisfies IdeaDestino).count()
  return count === 0
}

/** Sube todo lo que quedó marcado `pendingSync: true` entre las misiones. Se llama cada vez que hay conexión y sesión activa. */
export async function pushMissionsPending(userId: string): Promise<void> {
  if (!supabase) return
  const pendientes = await readMisionesPendientes()
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
 * Dispositivo nuevo / reinstalación: Dexie no tiene misiones locales pero
 * la cuenta puede tener datos reales en Supabase. Devuelve las tablas
 * realmente confirmadas (mismo contrato que migrateMissionsOnFirstLogin)
 * — el llamador usa esto para saber si puede marcar la migración completa
 * o si tiene que reintentar en el próximo inicio.
 */
export async function hydrateMissionsFromSupabase(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(SUPABASE_TABLE).select('*').eq('user_id', userId)
  if (error) {
    console.error(`[sync] hidratación falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  if (data && data.length > 0) {
    const ideas = data.map((row) => fromRow(row as MissionRow))
    await db.ideas.bulkPut(ideas)
  }
  return [SUPABASE_TABLE]
}

/** Primer login con misiones locales previas (creadas sin sesión): sube todo lo que ya existe en Dexie con destino='misiones'. */
export async function migrateMissionsOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const locales = await db.ideas.where('destino').equals('misiones' satisfies IdeaDestino).toArray()
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

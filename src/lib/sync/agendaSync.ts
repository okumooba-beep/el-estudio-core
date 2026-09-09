import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { AgendaEvento, AgendaBloque, AgendaPrioridad, AgendaAviso } from '@/types/agenda'
import type { EntityTable } from 'dexie'

/**
 * Fase 4 (sync Supabase) — Agenda. Dos tablas Dexie propias
 * (agendaEventos, agendaBloques — src/types/agenda.ts), mismo patrón
 * `TableSync` de financeSync.ts, una sola fila en `syncMeta` (agenda-sync).
 *
 * `agenda_eventos.idea_id` referencia el `id` de la Idea (destino
 * 'agenda') de la que nació el evento — sin foreign key, motores de sync
 * independientes, sin orden garantizado entre el push de Ideas y el de
 * Agenda (ver supabase/agenda_schema.sql).
 *
 * Ambas tablas tienen `deletedAt` (mismo patrón soft-delete): Eventos lo
 * suma recién acá — requiere la migración
 * `supabase/agenda_eventos_add_deleted_at.sql` corrida a mano en Supabase
 * antes de este cambio, igual que `agendaBloques` ya la tenía.
 */
interface EventoRow {
  id: string
  user_id: string
  texto: string
  fecha: string
  hora: string | null
  alarma: boolean
  completado: boolean
  prioridad: AgendaPrioridad
  aviso: AgendaAviso
  idea_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface BloqueRow {
  id: string
  user_id: string
  texto: string
  dia: string
  hora: string | null
  alarma: boolean
  completado: boolean
  archivado: boolean
  protegido: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface TableSync<Local extends { id: string; pendingSync: boolean }, Remote extends { id: string }> {
  supabaseTable: string
  dexieTable: EntityTable<Local, 'id'>
  toRow(userId: string, local: Local): Remote
  fromRow(row: Remote): Local
}

const eventosSync: TableSync<AgendaEvento, EventoRow> = {
  supabaseTable: 'agenda_eventos',
  dexieTable: db.agendaEventos,
  toRow: (userId, e) => ({
    id: e.id,
    user_id: userId,
    texto: e.texto,
    fecha: e.fecha,
    hora: e.hora,
    alarma: e.alarma,
    completado: e.completado,
    prioridad: e.prioridad,
    aviso: e.aviso,
    idea_id: e.ideaId,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted_at: e.deletedAt ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    texto: row.texto,
    fecha: row.fecha,
    hora: row.hora,
    alarma: row.alarma,
    completado: row.completado,
    prioridad: row.prioridad,
    aviso: row.aviso,
    ideaId: row.idea_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }),
}

const bloquesSync: TableSync<AgendaBloque, BloqueRow> = {
  supabaseTable: 'agenda_bloques',
  dexieTable: db.agendaBloques,
  toRow: (userId, b) => ({
    id: b.id,
    user_id: userId,
    texto: b.texto,
    dia: b.dia,
    hora: b.hora,
    alarma: b.alarma,
    completado: b.completado,
    archivado: b.archivado,
    protegido: b.protegido ?? false,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
    deleted_at: b.deletedAt ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    texto: row.texto,
    dia: row.dia,
    hora: row.hora,
    alarma: row.alarma,
    completado: row.completado,
    archivado: row.archivado,
    ...(row.protegido ? { protegido: row.protegido } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TABLES: TableSync<any, any>[] = [eventosSync, bloquesSync]

export async function allAgendaTablesEmpty(): Promise<boolean> {
  const counts = await Promise.all(ALL_TABLES.map((t) => t.dexieTable.count()))
  return counts.every((count) => count === 0)
}

/** Sube todo lo que quedó marcado `pendingSync: true` entre Eventos y Bloques. Se llama cada vez que hay conexión y sesión activa. */
export async function pushAgendaPending(userId: string): Promise<void> {
  if (!supabase) return
  for (const table of ALL_TABLES) {
    const pendientes = await readPending(table.dexieTable)
    if (pendientes.length === 0) continue
    const rows = pendientes.map((local) => table.toRow(userId, local))
    const { error } = await supabase.from(table.supabaseTable).upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error(`[sync] push falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    await markSynced(
      table.dexieTable,
      pendientes.map((row) => row.id),
    )
  }
}

/**
 * Dispositivo nuevo / reinstalación: Dexie está vacía pero la cuenta puede
 * tener datos reales en Supabase. Devuelve solo las tablas que realmente
 * confirmaron su lectura — el llamador usa esto para saber si puede marcar
 * la migración completa o si tiene que reintentar en el próximo inicio.
 */
export async function hydrateAgendaFromSupabase(userId: string): Promise<string[]> {
  if (!supabase) return []
  const tablasConfirmadas: string[] = []
  for (const table of ALL_TABLES) {
    const { data, error } = await supabase.from(table.supabaseTable).select('*').eq('user_id', userId)
    if (error) {
      console.error(`[sync] hidratación falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    if (data && data.length > 0) {
      const locales = data.map((row) => table.fromRow(row))
      await table.dexieTable.bulkPut(locales)
    }
    tablasConfirmadas.push(table.supabaseTable)
  }
  return tablasConfirmadas
}

/** Primer login con datos locales previos (creados sin sesión): sube todo lo que ya existe en Dexie, tabla por tabla. */
export async function migrateAgendaOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const tablasConfirmadas: string[] = []
  for (const table of ALL_TABLES) {
    const locales = await table.dexieTable.toArray()
    if (locales.length === 0) {
      tablasConfirmadas.push(table.supabaseTable)
      continue
    }
    const rows = locales.map((local) => table.toRow(userId, local))
    const { error } = await supabase.from(table.supabaseTable).upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error(`[sync] migración falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    await markSynced(
      table.dexieTable,
      locales.map((row) => row.id),
    )
    tablasConfirmadas.push(table.supabaseTable)
  }
  return tablasConfirmadas
}

/**
 * "Forzar re-sincronización de Agenda" en Ajustes — a diferencia de
 * `hydrateAgendaFromSupabase` (que solo agrega/actualiza y nunca corre
 * dos veces, gateada por `syncMeta.migratedAt`), esta función pull-y-
 * reconcilia: trae el estado real de Supabase y BORRA de Dexie local
 * cualquier fila que ya no esté ahí. Existe para el caso puntual de
 * filas borradas directo en el dashboard de Supabase (fuera de la app) —
 * sin esto, la hidratación de una sola vez nunca se entera de ese borrado
 * y el fantasma queda local para siempre.
 *
 * Nunca borra una fila con `pendingSync: true`: esa fila es una edición
 * local todavía no confirmada en el servidor (pudo crearse offline,
 * después de la última foto de Supabase que se está comparando acá) —
 * borrarla destruiría trabajo real nunca sincronizado.
 */
export async function reconcileAgendaFromSupabase(userId: string): Promise<void> {
  if (!supabase) return
  for (const table of ALL_TABLES) {
    const { data, error } = await supabase.from(table.supabaseTable).select('*').eq('user_id', userId)
    if (error) {
      console.error(`[sync] reconciliación falló en ${table.supabaseTable}:`, error.message)
      continue
    }
    const remotas = data ?? []
    const locales = remotas.map((row) => table.fromRow(row))
    if (locales.length > 0) await table.dexieTable.bulkPut(locales)

    const idsRemotos = new Set(remotas.map((row) => row.id))
    const filasLocales = await table.dexieTable.toArray()
    const idsABorrar = filasLocales
      .filter((local) => !idsRemotos.has(local.id) && !local.pendingSync)
      .map((local) => local.id)
    if (idsABorrar.length > 0) await table.dexieTable.bulkDelete(idsABorrar)
  }
}

import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { NotesFolder, NotesNote } from '@/types/notes'
import type { EntityTable } from 'dexie'

/**
 * Fase 4 (sync Supabase) — segundo módulo sincronizado, mismo motor que
 * Finanzas (ver src/lib/sync/financeSync.ts): opera directo sobre `db` y
 * sobre el cliente Supabase, fuera de `src/modules`.
 *
 * Cada tabla mapea su fila Dexie (camelCase) a una fila Supabase
 * (snake_case) — ver supabase/notes_schema.sql para el DDL real. El PIN
 * (`pinHash`) viaja igual que cualquier otro campo: ya llega hasheado, no
 * hay lógica especial acá.
 */

interface FolderRow {
  id: string
  user_id: string
  nombre: string
  pin_hash: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface NoteRow {
  id: string
  user_id: string
  folder_id: string
  titulo: string
  contenido: string
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

const foldersSync: TableSync<NotesFolder, FolderRow> = {
  supabaseTable: 'notes_folders',
  dexieTable: db.notesFolders,
  toRow: (userId, f) => ({
    id: f.id,
    user_id: userId,
    nombre: f.nombre,
    pin_hash: f.pinHash,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
    deleted_at: f.deletedAt ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    nombre: row.nombre,
    pinHash: row.pin_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }),
}

const notesSync: TableSync<NotesNote, NoteRow> = {
  supabaseTable: 'notes_notes',
  dexieTable: db.notesNotes,
  toRow: (userId, n) => ({
    id: n.id,
    user_id: userId,
    folder_id: n.folderId,
    titulo: n.titulo,
    contenido: n.contenido,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
    deleted_at: n.deletedAt ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    folderId: row.folder_id,
    titulo: row.titulo,
    contenido: row.contenido,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TABLES: TableSync<any, any>[] = [foldersSync, notesSync]

async function allNotesTablesEmpty(): Promise<boolean> {
  const counts = await Promise.all(ALL_TABLES.map((t) => t.dexieTable.count()))
  return counts.every((count) => count === 0)
}

/** Sube todo lo que quedó marcado `pendingSync: true` desde la última corrida. Se llama cada vez que hay conexión y sesión activa. */
export async function pushNotesPending(userId: string): Promise<void> {
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
 * confirmaron su lectura (mismo contrato que migrateNotesOnFirstLogin) —
 * el llamador usa esto para saber si puede marcar la migración completa o
 * si tiene que reintentar en el próximo inicio.
 */
export async function hydrateNotesFromSupabase(userId: string): Promise<string[]> {
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
export async function migrateNotesOnFirstLogin(userId: string): Promise<string[]> {
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

export { allNotesTablesEmpty }

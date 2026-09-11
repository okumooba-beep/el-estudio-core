import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { NotesFolder, NotesNote } from '@/types/notes'
import type { EntityTable } from 'dexie'

/**
 * "Mi proyecto" — mismo motor de sync que Notas (ver notesSync.ts), tabla
 * por tabla propia (mi_proyecto_folders/mi_proyecto_notes, ver
 * supabase/mi_proyecto_schema.sql) para que los dos espacios nunca
 * compartan datos aunque reutilicen el mismo tipo NotesFolder/NotesNote.
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
  supabaseTable: 'mi_proyecto_folders',
  dexieTable: db.miProyectoFolders,
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
  supabaseTable: 'mi_proyecto_notes',
  dexieTable: db.miProyectoNotes,
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

async function allMiProyectoTablesEmpty(): Promise<boolean> {
  const counts = await Promise.all(ALL_TABLES.map((t) => t.dexieTable.count()))
  return counts.every((count) => count === 0)
}

/** Sube todo lo que quedó marcado `pendingSync: true` desde la última corrida. Se llama cada vez que hay conexión y sesión activa. */
export async function pushMiProyectoPending(userId: string): Promise<void> {
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
 * confirmaron su lectura (mismo contrato que migrateMiProyectoOnFirstLogin).
 */
export async function hydrateMiProyectoFromSupabase(userId: string): Promise<string[]> {
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
export async function migrateMiProyectoOnFirstLogin(userId: string): Promise<string[]> {
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

export { allMiProyectoTablesEmpty }

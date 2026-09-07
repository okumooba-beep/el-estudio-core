import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { Recordatorio } from '@/types/recordatorio'

/**
 * Fase 2 (sync Supabase) — Recordatorios. `recordatorios` es tabla Dexie
 * propia (src/types/recordatorio.ts), sin ningún destino/Idea cruzado —
 * sincronización simple, de tabla única, mismo criterio que Trading (ver
 * tradingSync.ts).
 *
 * A diferencia de las demás tablas: `enviado`/`enviadoEn` los escribe
 * dispatch-reminders del lado del servidor, no el cliente — pushPending
 * solo sube lo que el cliente creó/editó (título, cuerpo, dispararEn), y
 * como este motor nunca vuelve a hidratar después del primer login (mismo
 * límite que el resto de las tablas sincronizadas hoy), el estado
 * enviado=true que pone el servidor no se refleja de vuelta en este
 * dispositivo hasta una reinstalación. No es una limitación nueva de esta
 * tabla — es el mismo comportamiento que ya tienen Hábitos/Trading/Agenda/
 * Auditoría.
 *
 * Sin `deletedAt`: no hay borrado real todavía (mismo criterio que Trading).
 */
interface RecordatorioRow {
  id: string
  user_id: string
  origen_tipo: string
  origen_id: string | null
  titulo: string
  cuerpo: string
  disparar_en: string
  enviado: boolean
  enviado_en: string | null
  created_at: string
  updated_at: string
}

const SUPABASE_TABLE = 'recordatorios'

function toRow(userId: string, recordatorio: Recordatorio): RecordatorioRow {
  return {
    id: recordatorio.id,
    user_id: userId,
    origen_tipo: recordatorio.origenTipo,
    origen_id: recordatorio.origenId,
    titulo: recordatorio.titulo,
    cuerpo: recordatorio.cuerpo,
    disparar_en: recordatorio.dispararEn,
    enviado: recordatorio.enviado,
    enviado_en: recordatorio.enviadoEn,
    created_at: recordatorio.createdAt,
    updated_at: recordatorio.updatedAt,
  }
}

function fromRow(row: RecordatorioRow): Recordatorio {
  return {
    id: row.id,
    origenTipo: row.origen_tipo as Recordatorio['origenTipo'],
    origenId: row.origen_id,
    titulo: row.titulo,
    cuerpo: row.cuerpo,
    dispararEn: row.disparar_en,
    enviado: row.enviado,
    enviadoEn: row.enviado_en,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }
}

export async function allRecordatoriosEmpty(): Promise<boolean> {
  return (await db.recordatorios.count()) === 0
}

/** Sube todo lo que quedó marcado `pendingSync: true`. Se llama cada vez que hay conexión y sesión activa. */
export async function pushRecordatoriosPending(userId: string): Promise<void> {
  if (!supabase) return
  const pendientes = await readPending(db.recordatorios)
  if (pendientes.length === 0) return
  const rows = pendientes.map((recordatorio) => toRow(userId, recordatorio))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] push falló en ${SUPABASE_TABLE}:`, error.message)
    return
  }
  await markSynced(
    db.recordatorios,
    pendientes.map((recordatorio) => recordatorio.id),
  )
}

/**
 * Dispositivo nuevo / reinstalación: Dexie no tiene recordatorios locales
 * pero la cuenta puede tener datos reales en Supabase. Devuelve las tablas
 * realmente confirmadas — el llamador usa esto para saber si puede marcar
 * la migración completa o si tiene que reintentar en el próximo inicio.
 */
export async function hydrateRecordatoriosFromSupabase(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(SUPABASE_TABLE).select('*').eq('user_id', userId)
  if (error) {
    console.error(`[sync] hidratación falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  if (data && data.length > 0) {
    const recordatorios = data.map((row) => fromRow(row as RecordatorioRow))
    await db.recordatorios.bulkPut(recordatorios)
  }
  return [SUPABASE_TABLE]
}

/** Primer login con recordatorios locales previos (creados sin sesión): sube todo lo que ya existe en Dexie. */
export async function migrateRecordatoriosOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const locales = await db.recordatorios.toArray()
  if (locales.length === 0) return [SUPABASE_TABLE]
  const rows = locales.map((recordatorio) => toRow(userId, recordatorio))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] migración falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  await markSynced(
    db.recordatorios,
    locales.map((recordatorio) => recordatorio.id),
  )
  return [SUPABASE_TABLE]
}

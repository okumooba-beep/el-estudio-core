import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { HabitCheck } from '@/types/habitCheck'

/**
 * Fase 4 (sync Supabase) — Hábitos. `habitChecks` es tabla Dexie propia
 * (src/types/habitCheck.ts, un círculo marcado/desmarcado por hábito+fecha)
 * — a diferencia de la definición del hábito en sí (el nombre), que vive
 * en `db.ideas` con `destino: 'habitos'` y sincroniza aparte, vía
 * ideasSync.ts ampliado (ver supabase/ideas_add_habitos_agenda.sql). Este
 * motor solo cubre `habitChecks`, nunca esas Ideas.
 *
 * Sin `deletedAt`: `setChecked` solo hace upsert por habitId+fecha, nunca
 * delete (ver supabase/habits_schema.sql).
 */
interface HabitCheckRow {
  id: string
  user_id: string
  habit_id: string
  fecha: string
  checked: boolean
  updated_at: string
}

const SUPABASE_TABLE = 'habit_checks'

function toRow(userId: string, check: HabitCheck): HabitCheckRow {
  return {
    id: check.id,
    user_id: userId,
    habit_id: check.habitId,
    fecha: check.fecha,
    checked: check.checked,
    updated_at: check.updatedAt,
  }
}

function fromRow(row: HabitCheckRow): HabitCheck {
  return {
    id: row.id,
    habitId: row.habit_id,
    fecha: row.fecha,
    checked: row.checked,
    updatedAt: row.updated_at,
    pendingSync: false,
  }
}

export async function allHabitsEmpty(): Promise<boolean> {
  return (await db.habitChecks.count()) === 0
}

/** Sube todo lo que quedó marcado `pendingSync: true`. Se llama cada vez que hay conexión y sesión activa. */
export async function pushHabitsPending(userId: string): Promise<void> {
  if (!supabase) return
  const pendientes = await readPending(db.habitChecks)
  if (pendientes.length === 0) return
  const rows = pendientes.map((check) => toRow(userId, check))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] push falló en ${SUPABASE_TABLE}:`, error.message)
    return
  }
  await markSynced(
    db.habitChecks,
    pendientes.map((check) => check.id),
  )
}

/**
 * Dispositivo nuevo / reinstalación: Dexie no tiene checks locales pero la
 * cuenta puede tener datos reales en Supabase. Devuelve las tablas
 * realmente confirmadas — el llamador usa esto para saber si puede marcar
 * la migración completa o si tiene que reintentar en el próximo inicio.
 */
export async function hydrateHabitsFromSupabase(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(SUPABASE_TABLE).select('*').eq('user_id', userId)
  if (error) {
    console.error(`[sync] hidratación falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  if (data && data.length > 0) {
    const checks = data.map((row) => fromRow(row as HabitCheckRow))
    await db.habitChecks.bulkPut(checks)
  }
  return [SUPABASE_TABLE]
}

/** Primer login con checks locales previos (creados sin sesión): sube todo lo que ya existe en Dexie. */
export async function migrateHabitsOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const locales = await db.habitChecks.toArray()
  if (locales.length === 0) return [SUPABASE_TABLE]
  const rows = locales.map((check) => toRow(userId, check))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] migración falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  await markSynced(
    db.habitChecks,
    locales.map((check) => check.id),
  )
  return [SUPABASE_TABLE]
}

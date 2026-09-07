import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { Operacion, OperacionChecklist, OperacionLado } from '@/types/operacion'

/**
 * Fase 4 (sync Supabase) — Trading. `operaciones` es tabla Dexie propia
 * (src/types/operacion.ts), sin ningún destino/Idea cruzado (Sprint 3.5:
 * una Operación nunca pasa por `db.ideas`) — sincronización simple, de
 * tabla única, a diferencia de Hábitos/Agenda.
 *
 * `imagen` (Blob | null) queda deliberadamente afuera de `toRow`/`fromRow`:
 * el propio tipo la documenta como "todo local, nunca sube a internet"
 * (Sprint 3.5, parte 5) — un Blob no viaja en un upsert JSON. El resto de
 * los campos sincroniza normal; una Operación hidratada desde Supabase
 * siempre trae `imagen: null` (ver supabase/trading_schema.sql).
 *
 * Sin `deletedAt`: operacionRepository solo expone list/add/update, no hay
 * borrado real todavía (mismo criterio que Hábitos).
 */
interface OperacionRow {
  id: string
  user_id: string
  fecha: string
  hora: string
  instrumento: string
  setup: string
  lado: OperacionLado
  resultado_puntos: number
  resultado_usd: number
  resumen: string
  emociones: string
  aprendizajes: string
  checklist: OperacionChecklist
  created_at: string
  updated_at: string
}

const SUPABASE_TABLE = 'operaciones'

function toRow(userId: string, op: Operacion): OperacionRow {
  return {
    id: op.id,
    user_id: userId,
    fecha: op.fecha,
    hora: op.hora,
    instrumento: op.instrumento,
    setup: op.setup,
    lado: op.lado,
    resultado_puntos: op.resultadoPuntos,
    resultado_usd: op.resultadoUSD,
    resumen: op.resumen,
    emociones: op.emociones,
    aprendizajes: op.aprendizajes,
    checklist: op.checklist,
    created_at: op.createdAt,
    updated_at: op.updatedAt,
  }
}

function fromRow(row: OperacionRow): Operacion {
  return {
    id: row.id,
    fecha: row.fecha,
    hora: row.hora,
    instrumento: row.instrumento,
    setup: row.setup,
    lado: row.lado,
    resultadoPuntos: row.resultado_puntos,
    resultadoUSD: row.resultado_usd,
    imagen: null,
    resumen: row.resumen,
    emociones: row.emociones,
    aprendizajes: row.aprendizajes,
    checklist: row.checklist,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }
}

export async function allTradingEmpty(): Promise<boolean> {
  return (await db.operaciones.count()) === 0
}

/** Sube todo lo que quedó marcado `pendingSync: true`. Se llama cada vez que hay conexión y sesión activa. */
export async function pushTradingPending(userId: string): Promise<void> {
  if (!supabase) return
  const pendientes = await readPending(db.operaciones)
  if (pendientes.length === 0) return
  const rows = pendientes.map((op) => toRow(userId, op))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] push falló en ${SUPABASE_TABLE}:`, error.message)
    return
  }
  await markSynced(
    db.operaciones,
    pendientes.map((op) => op.id),
  )
}

/**
 * Dispositivo nuevo / reinstalación: Dexie no tiene operaciones locales
 * pero la cuenta puede tener datos reales en Supabase. Devuelve las
 * tablas realmente confirmadas — el llamador usa esto para saber si puede
 * marcar la migración completa o si tiene que reintentar en el próximo
 * inicio.
 */
export async function hydrateTradingFromSupabase(userId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(SUPABASE_TABLE).select('*').eq('user_id', userId)
  if (error) {
    console.error(`[sync] hidratación falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  if (data && data.length > 0) {
    const operaciones = data.map((row) => fromRow(row as OperacionRow))
    await db.operaciones.bulkPut(operaciones)
  }
  return [SUPABASE_TABLE]
}

/** Primer login con operaciones locales previas (creadas sin sesión): sube todo lo que ya existe en Dexie. */
export async function migrateTradingOnFirstLogin(userId: string): Promise<string[]> {
  if (!supabase) return []
  const locales = await db.operaciones.toArray()
  if (locales.length === 0) return [SUPABASE_TABLE]
  const rows = locales.map((op) => toRow(userId, op))
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(rows, { onConflict: 'id' })
  if (error) {
    console.error(`[sync] migración falló en ${SUPABASE_TABLE}:`, error.message)
    return []
  }
  await markSynced(
    db.operaciones,
    locales.map((op) => op.id),
  )
  return [SUPABASE_TABLE]
}

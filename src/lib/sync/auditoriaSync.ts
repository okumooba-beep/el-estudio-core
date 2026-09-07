import { db } from '@/lib/db/db'
import { supabase } from '@/lib/supabase/client'
import { readPending, markSynced } from './pendingSync'
import type { AuditRuptura, AuditPremortem, AuditCorreccionSemanal, AuditConfig, RupturaTipo } from '@/types/auditoria'
import type { EntityTable } from 'dexie'

/**
 * Fase 4 (sync Supabase) — Auditoría. Cuatro tablas Dexie propias
 * (auditRupturas, auditPremortems, auditCorrecciones, auditConfig —
 * src/types/auditoria.ts), mismo patrón `TableSync` de financeSync.ts para
 * las primeras tres, una sola fila en `syncMeta` (auditoria-sync).
 *
 * `auditConfig` es la excepción: fila única por usuario, clave real
 * `user_id` (Dexie usa el id fijo local `'config'`, que no es único entre
 * usuarios distintos) — no encaja en el `TableSync<Local,Remote>` genérico
 * (que asume `Remote.id`), así que se sincroniza aparte, con
 * `onConflict: 'user_id'` en vez de `'id'` (ver supabase/auditoria_schema.sql).
 *
 * `auditPremortems` sí tiene `deletedAt`: `AuditPremortemRepository.delete()`
 * pasó de borrado físico a soft-delete en este mismo sprint (ver
 * auditoriaRepository.ts). `auditRupturas`/`auditCorrecciones` no exponen
 * ningún delete — sin `deletedAt`.
 */
interface RupturaRow {
  id: string
  user_id: string
  fecha: string
  texto: string
  tipo: RupturaTipo
  origen_id: string | null
  created_at: string
  updated_at: string
}

interface PremortemRow {
  id: string
  user_id: string
  semana_id: string
  patron: string
  primera_senal: string
  cuando: string
  respuesta: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface CorreccionRow {
  id: string
  user_id: string
  semana_id: string
  promesa: string
  ejecutado_real: string
  evidencia_producida: string
  capa_ruptura: RupturaTipo
  aprendizaje: string
  correccion_unica: string
  donde_en_calendario: string
  bloque_creado_id: string | null
  created_at: string
  updated_at: string
}

interface ConfigRow {
  user_id: string
  resultado_dominante: string
  rutinas_reconocidas: AuditConfig['rutinasReconocidas']
  senal_roja: AuditConfig['señalRoja']
  created_at: string
  updated_at: string
}

interface TableSync<Local extends { id: string; pendingSync: boolean }, Remote extends { id: string }> {
  supabaseTable: string
  dexieTable: EntityTable<Local, 'id'>
  toRow(userId: string, local: Local): Remote
  fromRow(row: Remote): Local
}

const rupturasSync: TableSync<AuditRuptura, RupturaRow> = {
  supabaseTable: 'audit_rupturas',
  dexieTable: db.auditRupturas,
  toRow: (userId, r) => ({
    id: r.id,
    user_id: userId,
    fecha: r.fecha,
    texto: r.texto,
    tipo: r.tipo,
    origen_id: r.origenId ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }),
  fromRow: (row) => ({
    id: row.id,
    fecha: row.fecha,
    texto: row.texto,
    tipo: row.tipo,
    ...(row.origen_id ? { origenId: row.origen_id } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }),
}

const premortemsSync: TableSync<AuditPremortem, PremortemRow> = {
  supabaseTable: 'audit_premortems',
  dexieTable: db.auditPremortems,
  toRow: (userId, p) => ({
    id: p.id,
    user_id: userId,
    semana_id: p.semanaId,
    patron: p.patron,
    primera_senal: p.primeraSeñal,
    cuando: p.cuando,
    respuesta: p.respuesta,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    deleted_at: p.deletedAt ?? null,
  }),
  fromRow: (row) => ({
    id: row.id,
    semanaId: row.semana_id,
    patron: row.patron,
    primeraSeñal: row.primera_senal,
    cuando: row.cuando,
    respuesta: row.respuesta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  }),
}

const correccionesSync: TableSync<AuditCorreccionSemanal, CorreccionRow> = {
  supabaseTable: 'audit_correcciones',
  dexieTable: db.auditCorrecciones,
  toRow: (userId, c) => ({
    id: c.id,
    user_id: userId,
    semana_id: c.semanaId,
    promesa: c.promesa,
    ejecutado_real: c.ejecutadoReal,
    evidencia_producida: c.evidenciaProducida,
    capa_ruptura: c.capaRuptura,
    aprendizaje: c.aprendizaje,
    correccion_unica: c.correccionUnica,
    donde_en_calendario: c.dondeEnCalendario,
    bloque_creado_id: c.bloqueCreadoId ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }),
  fromRow: (row) => ({
    id: row.id,
    semanaId: row.semana_id,
    promesa: row.promesa,
    ejecutadoReal: row.ejecutado_real,
    evidenciaProducida: row.evidencia_producida,
    capaRuptura: row.capa_ruptura,
    aprendizaje: row.aprendizaje,
    correccionUnica: row.correccion_unica,
    dondeEnCalendario: row.donde_en_calendario,
    ...(row.bloque_creado_id ? { bloqueCreadoId: row.bloque_creado_id } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_TABLES: TableSync<any, any>[] = [rupturasSync, premortemsSync, correccionesSync]
const CONFIG_TABLE = 'audit_config'

function configToRow(userId: string, config: AuditConfig): ConfigRow {
  return {
    user_id: userId,
    resultado_dominante: config.resultadoDominante,
    rutinas_reconocidas: config.rutinasReconocidas,
    senal_roja: config.señalRoja,
    created_at: config.createdAt,
    updated_at: config.updatedAt,
  }
}

function configFromRow(row: ConfigRow): AuditConfig {
  return {
    id: 'config',
    resultadoDominante: row.resultado_dominante,
    rutinasReconocidas: row.rutinas_reconocidas,
    señalRoja: row.senal_roja,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pendingSync: false,
  }
}

export async function allAuditoriaTablesEmpty(): Promise<boolean> {
  const counts = await Promise.all(ALL_TABLES.map((t) => t.dexieTable.count()))
  const configCount = await db.auditConfig.count()
  return counts.every((count) => count === 0) && configCount === 0
}

/** Sube todo lo que quedó marcado `pendingSync: true` en las cuatro tablas. Se llama cada vez que hay conexión y sesión activa. */
export async function pushAuditoriaPending(userId: string): Promise<void> {
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

  const configPendiente = await readPending(db.auditConfig)
  if (configPendiente.length > 0) {
    const row = configToRow(userId, configPendiente[0]!)
    const { error } = await supabase.from(CONFIG_TABLE).upsert([row], { onConflict: 'user_id' })
    if (error) {
      console.error(`[sync] push falló en ${CONFIG_TABLE}:`, error.message)
    } else {
      await markSynced(
        db.auditConfig,
        configPendiente.map((c) => c.id),
      )
    }
  }
}

/**
 * Dispositivo nuevo / reinstalación: Dexie está vacía pero la cuenta puede
 * tener datos reales en Supabase. Devuelve solo las tablas que realmente
 * confirmaron su lectura — el llamador usa esto para saber si puede marcar
 * la migración completa o si tiene que reintentar en el próximo inicio.
 */
export async function hydrateAuditoriaFromSupabase(userId: string): Promise<string[]> {
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

  const { data, error } = await supabase.from(CONFIG_TABLE).select('*').eq('user_id', userId)
  if (error) {
    console.error(`[sync] hidratación falló en ${CONFIG_TABLE}:`, error.message)
  } else {
    if (data && data.length > 0) {
      await db.auditConfig.put(configFromRow(data[0] as ConfigRow))
    }
    tablasConfirmadas.push(CONFIG_TABLE)
  }

  return tablasConfirmadas
}

/** Primer login con datos locales previos (creados sin sesión): sube todo lo que ya existe en Dexie, tabla por tabla. */
export async function migrateAuditoriaOnFirstLogin(userId: string): Promise<string[]> {
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

  const configLocal = await db.auditConfig.get('config')
  if (!configLocal) {
    tablasConfirmadas.push(CONFIG_TABLE)
  } else {
    const row = configToRow(userId, configLocal)
    const { error } = await supabase.from(CONFIG_TABLE).upsert([row], { onConflict: 'user_id' })
    if (error) {
      console.error(`[sync] migración falló en ${CONFIG_TABLE}:`, error.message)
    } else {
      await markSynced(db.auditConfig, [configLocal.id])
      tablasConfirmadas.push(CONFIG_TABLE)
    }
  }

  return tablasConfirmadas
}

import { db } from '@/lib/db/db'
import {
  allFinanceTablesEmpty,
  hydrateFinanceFromSupabase,
  migrateFinanceOnFirstLogin,
  pushFinancePending,
} from './financeSync'
import {
  allNotesTablesEmpty,
  hydrateNotesFromSupabase,
  migrateNotesOnFirstLogin,
  pushNotesPending,
} from './notesSync'
import {
  allMissionsEmpty,
  hydrateMissionsFromSupabase,
  migrateMissionsOnFirstLogin,
  pushMissionsPending,
} from './missionsSync'
import { allIdeasEmpty, hydrateIdeasFromSupabase, migrateIdeasOnFirstLogin, pushIdeasPending } from './ideasSync'
import { allHabitsEmpty, hydrateHabitsFromSupabase, migrateHabitsOnFirstLogin, pushHabitsPending } from './habitsSync'
import {
  allTradingEmpty,
  hydrateTradingFromSupabase,
  migrateTradingOnFirstLogin,
  pushTradingPending,
} from './tradingSync'
import {
  allAgendaTablesEmpty,
  hydrateAgendaFromSupabase,
  migrateAgendaOnFirstLogin,
  pushAgendaPending,
} from './agendaSync'
import {
  allAuditoriaTablesEmpty,
  hydrateAuditoriaFromSupabase,
  migrateAuditoriaOnFirstLogin,
  pushAuditoriaPending,
} from './auditoriaSync'
import {
  allRecordatoriosEmpty,
  hydrateRecordatoriosFromSupabase,
  migrateRecordatoriosOnFirstLogin,
  pushRecordatoriosPending,
} from './recordatoriosSync'

const PUSH_INTERVAL_MS = 20_000
const FINANCE_TABLES = ['finance_accounts', 'finance_movimientos', 'finance_goals', 'finance_income_periods']
const NOTES_TABLES = ['notes_folders', 'notes_notes']
const MISSIONS_TABLES = ['missions']
const IDEAS_TABLES = ['ideas']
const HABITS_TABLES = ['habit_checks']
const TRADING_TABLES = ['operaciones']
const AGENDA_TABLES = ['agenda_eventos', 'agenda_bloques']
const AUDITORIA_TABLES = ['audit_rupturas', 'audit_premortems', 'audit_correcciones', 'audit_config']
const RECORDATORIOS_TABLES = ['recordatorios']

let pushIntervalId: ReturnType<typeof setInterval> | null = null
let onlineListener: (() => void) | null = null
let bootstrappedUserId: string | null = null

let notesPushIntervalId: ReturnType<typeof setInterval> | null = null
let notesOnlineListener: (() => void) | null = null
let notesBootstrappedUserId: string | null = null

let missionsPushIntervalId: ReturnType<typeof setInterval> | null = null
let missionsOnlineListener: (() => void) | null = null
let missionsBootstrappedUserId: string | null = null

let ideasPushIntervalId: ReturnType<typeof setInterval> | null = null
let ideasOnlineListener: (() => void) | null = null
let ideasBootstrappedUserId: string | null = null

let habitsPushIntervalId: ReturnType<typeof setInterval> | null = null
let habitsOnlineListener: (() => void) | null = null
let habitsBootstrappedUserId: string | null = null

let tradingPushIntervalId: ReturnType<typeof setInterval> | null = null
let tradingOnlineListener: (() => void) | null = null
let tradingBootstrappedUserId: string | null = null

let agendaPushIntervalId: ReturnType<typeof setInterval> | null = null
let agendaOnlineListener: (() => void) | null = null
let agendaBootstrappedUserId: string | null = null

let auditoriaPushIntervalId: ReturnType<typeof setInterval> | null = null
let auditoriaOnlineListener: (() => void) | null = null
let auditoriaBootstrappedUserId: string | null = null

let recordatoriosPushIntervalId: ReturnType<typeof setInterval> | null = null
let recordatoriosOnlineListener: (() => void) | null = null
let recordatoriosBootstrappedUserId: string | null = null

async function markMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = FINANCE_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markNotesMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = NOTES_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'notes-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markMissionsMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = MISSIONS_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'missions-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markIdeasMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = IDEAS_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'ideas-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markHabitsMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = HABITS_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'habits-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markTradingMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = TRADING_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'trading-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markAgendaMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = AGENDA_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'agenda-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markAuditoriaMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = AUDITORIA_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'auditoria-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

async function markRecordatoriosMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = RECORDATORIOS_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'recordatorios-sync',
    userId,
    migratedAt: completo ? new Date().toISOString() : null,
    migratedTables: tablasConfirmadas,
  })
}

function startPushLoop(userId: string): void {
  stopFinanceSync()
  const push = () => {
    void pushFinancePending(userId)
  }
  pushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  onlineListener = push
  window.addEventListener('online', onlineListener)
  push()
}

function startNotesPushLoop(userId: string): void {
  stopNotesSync()
  const push = () => {
    void pushNotesPending(userId)
  }
  notesPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  notesOnlineListener = push
  window.addEventListener('online', notesOnlineListener)
  push()
}

function startMissionsPushLoop(userId: string): void {
  stopMissionsSync()
  const push = () => {
    void pushMissionsPending(userId)
  }
  missionsPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  missionsOnlineListener = push
  window.addEventListener('online', missionsOnlineListener)
  push()
}

function startIdeasPushLoop(userId: string): void {
  stopIdeasSync()
  const push = () => {
    void pushIdeasPending(userId)
  }
  ideasPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  ideasOnlineListener = push
  window.addEventListener('online', ideasOnlineListener)
  push()
}

function startHabitsPushLoop(userId: string): void {
  stopHabitsSync()
  const push = () => {
    void pushHabitsPending(userId)
  }
  habitsPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  habitsOnlineListener = push
  window.addEventListener('online', habitsOnlineListener)
  push()
}

function startTradingPushLoop(userId: string): void {
  stopTradingSync()
  const push = () => {
    void pushTradingPending(userId)
  }
  tradingPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  tradingOnlineListener = push
  window.addEventListener('online', tradingOnlineListener)
  push()
}

function startAgendaPushLoop(userId: string): void {
  stopAgendaSync()
  const push = () => {
    void pushAgendaPending(userId)
  }
  agendaPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  agendaOnlineListener = push
  window.addEventListener('online', agendaOnlineListener)
  push()
}

function startAuditoriaPushLoop(userId: string): void {
  stopAuditoriaSync()
  const push = () => {
    void pushAuditoriaPending(userId)
  }
  auditoriaPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  auditoriaOnlineListener = push
  window.addEventListener('online', auditoriaOnlineListener)
  push()
}

function startRecordatoriosPushLoop(userId: string): void {
  stopRecordatoriosSync()
  const push = () => {
    void pushRecordatoriosPending(userId)
  }
  recordatoriosPushIntervalId = setInterval(push, PUSH_INTERVAL_MS)
  recordatoriosOnlineListener = push
  window.addEventListener('online', recordatoriosOnlineListener)
  push()
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopFinanceSync(): void {
  if (pushIntervalId) clearInterval(pushIntervalId)
  if (onlineListener) window.removeEventListener('online', onlineListener)
  pushIntervalId = null
  onlineListener = null
  bootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopNotesSync(): void {
  if (notesPushIntervalId) clearInterval(notesPushIntervalId)
  if (notesOnlineListener) window.removeEventListener('online', notesOnlineListener)
  notesPushIntervalId = null
  notesOnlineListener = null
  notesBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopMissionsSync(): void {
  if (missionsPushIntervalId) clearInterval(missionsPushIntervalId)
  if (missionsOnlineListener) window.removeEventListener('online', missionsOnlineListener)
  missionsPushIntervalId = null
  missionsOnlineListener = null
  missionsBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopIdeasSync(): void {
  if (ideasPushIntervalId) clearInterval(ideasPushIntervalId)
  if (ideasOnlineListener) window.removeEventListener('online', ideasOnlineListener)
  ideasPushIntervalId = null
  ideasOnlineListener = null
  ideasBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopHabitsSync(): void {
  if (habitsPushIntervalId) clearInterval(habitsPushIntervalId)
  if (habitsOnlineListener) window.removeEventListener('online', habitsOnlineListener)
  habitsPushIntervalId = null
  habitsOnlineListener = null
  habitsBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopTradingSync(): void {
  if (tradingPushIntervalId) clearInterval(tradingPushIntervalId)
  if (tradingOnlineListener) window.removeEventListener('online', tradingOnlineListener)
  tradingPushIntervalId = null
  tradingOnlineListener = null
  tradingBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopAgendaSync(): void {
  if (agendaPushIntervalId) clearInterval(agendaPushIntervalId)
  if (agendaOnlineListener) window.removeEventListener('online', agendaOnlineListener)
  agendaPushIntervalId = null
  agendaOnlineListener = null
  agendaBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopAuditoriaSync(): void {
  if (auditoriaPushIntervalId) clearInterval(auditoriaPushIntervalId)
  if (auditoriaOnlineListener) window.removeEventListener('online', auditoriaOnlineListener)
  auditoriaPushIntervalId = null
  auditoriaOnlineListener = null
  auditoriaBootstrappedUserId = null
}

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopRecordatoriosSync(): void {
  if (recordatoriosPushIntervalId) clearInterval(recordatoriosPushIntervalId)
  if (recordatoriosOnlineListener) window.removeEventListener('online', recordatoriosOnlineListener)
  recordatoriosPushIntervalId = null
  recordatoriosOnlineListener = null
  recordatoriosBootstrappedUserId = null
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * antes de marcar la sesión como "lista": hidrata o migra según
 * corresponda, y arranca el push periódico. Ver Verificación §10 del plan
 * — hydrate (dispositivo nuevo/reinstalado) y migrate (datos locales
 * previos al primer login) son mutuamente excluyentes en la práctica,
 * así que se elige uno de los dos según el estado real de Dexie en vez de
 * correr siempre ambos.
 */
export async function bootstrapFinanceSync(userId: string): Promise<void> {
  if (bootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('sync')
  if (meta && meta.userId !== userId) {
    // Cambio de cuenta en el mismo dispositivo: los datos locales que
    // quedaron pertenecen al usuario anterior. No se suben ni se
    // hidratan automáticamente — evita filtrar datos de una cuenta a
    // otra. El push periódico tampoco arranca en este caso.
    console.warn('[sync] syncMeta pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allFinanceTablesEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateFinanceFromSupabase(userId)
      await markMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateFinanceOnFirstLogin(userId)
      await markMigrated(userId, tablasConfirmadas)
    }
  }

  bootstrappedUserId = userId
  startPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a bootstrapFinanceSync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'notes-sync'`) para no pisar el progreso de
 * migración de Finanzas.
 */
export async function bootstrapNotesSync(userId: string): Promise<void> {
  if (notesBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('notes-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (notas) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allNotesTablesEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateNotesFromSupabase(userId)
      await markNotesMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateNotesOnFirstLogin(userId)
      await markNotesMigrated(userId, tablasConfirmadas)
    }
  }

  notesBootstrappedUserId = userId
  startNotesPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a bootstrapFinanceSync/bootstrapNotesSync. Mismo mecanismo, fila
 * propia en `syncMeta` (`id: 'missions-sync'`). Particularidad frente a
 * los otros dos: no hay una tabla Dexie dedicada — "vacío"/"migrar" se
 * evalúan sobre `db.ideas` filtrada por `destino === 'misiones'` (ver
 * missionsSync.ts).
 */
export async function bootstrapMissionsSync(userId: string): Promise<void> {
  if (missionsBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('missions-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (misiones) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allMissionsEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateMissionsFromSupabase(userId)
      await markMissionsMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateMissionsOnFirstLogin(userId)
      await markMissionsMigrated(userId, tablasConfirmadas)
    }
  }

  missionsBootstrappedUserId = userId
  startMissionsPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a los demás bootstrap*Sync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'ideas-sync'`). Particularidad frente a Finanzas/Notas
 * (igual que Misiones): no hay tabla Dexie dedicada — "vacío"/"migrar" se
 * evalúan sobre `db.ideas` filtrada por `destino IN ('asuntos',
 * 'biblioteca')` (ver ideasSync.ts).
 */
export async function bootstrapIdeasSync(userId: string): Promise<void> {
  if (ideasBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('ideas-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (asuntos/biblioteca) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allIdeasEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateIdeasFromSupabase(userId)
      await markIdeasMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateIdeasOnFirstLogin(userId)
      await markIdeasMigrated(userId, tablasConfirmadas)
    }
  }

  ideasBootstrappedUserId = userId
  startIdeasPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a los demás bootstrap*Sync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'habits-sync'`). Solo cubre `habitChecks` (la tabla
 * Dexie propia de Hábitos) — la definición del hábito en sí vive en
 * `db.ideas` y sincroniza vía bootstrapIdeasSync (ver habitsSync.ts).
 */
export async function bootstrapHabitsSync(userId: string): Promise<void> {
  if (habitsBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('habits-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (hábitos) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allHabitsEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateHabitsFromSupabase(userId)
      await markHabitsMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateHabitsOnFirstLogin(userId)
      await markHabitsMigrated(userId, tablasConfirmadas)
    }
  }

  habitsBootstrappedUserId = userId
  startHabitsPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a los demás bootstrap*Sync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'trading-sync'`). A diferencia de Hábitos/Agenda, no
 * hay ninguna Idea asociada — sincronización de tabla única, sin
 * particularidad (ver tradingSync.ts).
 */
export async function bootstrapTradingSync(userId: string): Promise<void> {
  if (tradingBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('trading-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (trading) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allTradingEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateTradingFromSupabase(userId)
      await markTradingMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateTradingOnFirstLogin(userId)
      await markTradingMigrated(userId, tablasConfirmadas)
    }
  }

  tradingBootstrappedUserId = userId
  startTradingPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a los demás bootstrap*Sync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'agenda-sync'`). Cubre `agendaEventos`/`agendaBloques`
 * — la captura pendiente (Idea con destino 'agenda') sincroniza vía
 * bootstrapIdeasSync (ver agendaSync.ts).
 */
export async function bootstrapAgendaSync(userId: string): Promise<void> {
  if (agendaBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('agenda-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (agenda) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allAgendaTablesEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateAgendaFromSupabase(userId)
      await markAgendaMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateAgendaOnFirstLogin(userId)
      await markAgendaMigrated(userId, tablasConfirmadas)
    }
  }

  agendaBootstrappedUserId = userId
  startAgendaPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a los demás bootstrap*Sync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'auditoria-sync'`). Cubre las cuatro tablas de
 * Auditoría, incluida `auditConfig` (fila única por usuario, ver
 * auditoriaSync.ts).
 */
export async function bootstrapAuditoriaSync(userId: string): Promise<void> {
  if (auditoriaBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('auditoria-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (auditoría) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allAuditoriaTablesEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateAuditoriaFromSupabase(userId)
      await markAuditoriaMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateAuditoriaOnFirstLogin(userId)
      await markAuditoriaMigrated(userId, tablasConfirmadas)
    }
  }

  auditoriaBootstrappedUserId = userId
  startAuditoriaPushLoop(userId)
}

/**
 * Se llama una vez por sesión nueva (ver src/lib/auth/AuthContext.tsx),
 * junto a los demás bootstrap*Sync. Mismo mecanismo, fila propia en
 * `syncMeta` (`id: 'recordatorios-sync'`). Igual que Trading: tabla única,
 * sin ninguna Idea asociada — sin particularidad (ver recordatoriosSync.ts).
 */
export async function bootstrapRecordatoriosSync(userId: string): Promise<void> {
  if (recordatoriosBootstrappedUserId === userId) return

  const meta = await db.syncMeta.get('recordatorios-sync')
  if (meta && meta.userId !== userId) {
    console.warn('[sync] syncMeta (recordatorios) pertenece a otro usuario — no se migra ni se hidrata automáticamente.')
    return
  }

  if (!meta?.migratedAt) {
    const vacia = await allRecordatoriosEmpty()
    if (vacia) {
      const tablasConfirmadas = await hydrateRecordatoriosFromSupabase(userId)
      await markRecordatoriosMigrated(userId, tablasConfirmadas)
    } else {
      const tablasConfirmadas = await migrateRecordatoriosOnFirstLogin(userId)
      await markRecordatoriosMigrated(userId, tablasConfirmadas)
    }
  }

  recordatoriosBootstrappedUserId = userId
  startRecordatoriosPushLoop(userId)
}

/**
 * Botón temporal "Forzar re-sincronización de Notas" en Ajustes — recupera
 * dispositivos que quedaron con `syncMeta.notes-sync.migratedAt` marcado
 * como completo de forma incorrecta (p. ej. porque la tabla en Supabase
 * todavía no existía cuando se corrió la hidratación/migración por primera
 * vez). Borra ese estado local y vuelve a correr bootstrapNotesSync desde
 * cero — si Dexie local sigue vacía, va a re-hidratar desde Supabase.
 */
export async function forceNotesResync(userId: string): Promise<void> {
  await db.syncMeta.delete('notes-sync')
  notesBootstrappedUserId = null
  await bootstrapNotesSync(userId)
}

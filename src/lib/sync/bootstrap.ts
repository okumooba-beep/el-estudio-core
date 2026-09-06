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

const PUSH_INTERVAL_MS = 20_000
const FINANCE_TABLES = ['finance_accounts', 'finance_movimientos', 'finance_goals', 'finance_income_periods']
const NOTES_TABLES = ['notes_folders', 'notes_notes']

let pushIntervalId: ReturnType<typeof setInterval> | null = null
let onlineListener: (() => void) | null = null
let bootstrappedUserId: string | null = null

let notesPushIntervalId: ReturnType<typeof setInterval> | null = null
let notesOnlineListener: (() => void) | null = null
let notesBootstrappedUserId: string | null = null

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

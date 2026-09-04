import { db } from '@/lib/db/db'
import {
  allFinanceTablesEmpty,
  hydrateFinanceFromSupabase,
  migrateFinanceOnFirstLogin,
  pushFinancePending,
} from './financeSync'

const PUSH_INTERVAL_MS = 20_000
const FINANCE_TABLES = ['finance_accounts', 'finance_movimientos', 'finance_goals', 'finance_income_periods']

let pushIntervalId: ReturnType<typeof setInterval> | null = null
let onlineListener: (() => void) | null = null
let bootstrappedUserId: string | null = null

async function markMigrated(userId: string, tablasConfirmadas: string[]): Promise<void> {
  const completo = FINANCE_TABLES.every((tabla) => tablasConfirmadas.includes(tabla))
  await db.syncMeta.put({
    id: 'sync',
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

/** Se llama al cerrar sesión: no tiene sentido seguir subiendo datos sin un usuario activo. */
export function stopFinanceSync(): void {
  if (pushIntervalId) clearInterval(pushIntervalId)
  if (onlineListener) window.removeEventListener('online', onlineListener)
  pushIntervalId = null
  onlineListener = null
  bootstrappedUserId = null
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
      await hydrateFinanceFromSupabase(userId)
      await markMigrated(userId, FINANCE_TABLES)
    } else {
      const tablasConfirmadas = await migrateFinanceOnFirstLogin(userId)
      await markMigrated(userId, tablasConfirmadas)
    }
  }

  bootstrappedUserId = userId
  startPushLoop(userId)
}

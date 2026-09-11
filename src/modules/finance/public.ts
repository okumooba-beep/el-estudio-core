import { createFinanceEngine } from '@/components/finance-engine/createFinanceEngine'
import { createFinanceEngineRepositories } from '@/components/finance-engine/financeEngineRepository'
import { categoriaDe } from '@/components/finance-engine/mes'
import { db } from '@/lib/db/db'
import type { FinanceAccount, FinanceMovimiento, FinanceGoal, FinanceIncomePeriod } from '@/types/finance'

/**
 * Superficie pública del módulo Finanzas. `finanzas` ya existía
 * reservado como IdeaDestino y FurnitureId (ver
 * work-table/destinoFurniture.ts) desde antes de tener ruta propia.
 * Threshold Experience V1: deja de ser un `ModulePlaceholder` — la
 * primera versión real vive en FinanceScreen (foundations only:
 * Patrimonio Neto, Liquidez, Flujo de Caja, Inversiones, Deudas, Metas),
 * importada directo en App.tsx (mismo patrón que HoyScreen/MisionesScreen/
 * DiarioScreen: la ruta importa la pantalla de su propio archivo, no de
 * `public.ts` — acá `public.ts` solo expone la identidad de navegación).
 *
 * El motor de Finanzas (createFinanceEngine, en
 * src/components/finance-engine/) es el mismo que instancia
 * FinanceScreen.tsx, apuntado a las mismas 4 tablas Dexie del Finanzas
 * general — cada `useEngine()` es una instancia de lectura
 * independiente sobre el mismo dato persistido, mismo criterio que ya
 * regía cuando `useFinance()` era un hook no parametrizado.
 */
export const MODULE = { path: '/finanzas', label: 'Finanzas' }

const engine = createFinanceEngine(db.financeAccounts, db.financeMovimientos, db.financeGoals, db.financeIncomePeriods)

/**
 * Señal de atención para Home (Sprint "Home refleja estado real de los
 * Espacios"): mismo criterio que ya usa FinanceScreen para "Por revisar"
 * (mes.ts, `categoriaDe(movimiento) === null` sobre egresos) — sin
 * acotar por mes, porque a Home le importa si existe algo pendiente,
 * no en qué mes cayó. Home recibe solo destino + mensaje, nunca la
 * lista de movimientos ni el criterio de categorización.
 */
export function useAttentionSignal(): { destino: 'finanzas'; mensaje: string } | null {
  const { movimientos } = engine.useEngine()
  const hayPorRevisar = movimientos.some((movimiento) => movimiento.tipo === 'egreso' && categoriaDe(movimiento) === null)
  return hayPorRevisar ? { destino: 'finanzas', mensaje: 'Finanzas tiene un movimiento por revisar' } : null
}

/**
 * Ajustes — "Exportar datos": una foto de solo lectura de las cuatro
 * tablas de Finanzas, para que Ajustes arme un backup en JSON sin tocar
 * el interior del módulo (dependency-cruiser, `settings-boundaries`).
 * Nunca escribe nada — mismo motivo por el que expone una función
 * puntual y no el motor completo (que trae altas/bajas).
 */
export interface FinanzasExport {
  movimientos: FinanceMovimiento[]
  periodos: FinanceIncomePeriod[]
  accounts: FinanceAccount[]
  goals: FinanceGoal[]
}

const { accountRepository, movimientoRepository, goalRepository, periodoRepository } = createFinanceEngineRepositories(
  db.financeAccounts,
  db.financeMovimientos,
  db.financeGoals,
  db.financeIncomePeriods,
)

export async function obtenerDatosParaExportar(): Promise<FinanzasExport> {
  const [movimientos, periodos, accounts, goals] = await Promise.all([
    movimientoRepository.list(),
    periodoRepository.list(),
    accountRepository.list(),
    goalRepository.list(),
  ])
  return { movimientos, periodos, accounts, goals }
}

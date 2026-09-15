import { createFinanceEngine } from '@/components/finance-engine/createFinanceEngine'
import { CATEGORIA_LABEL } from '@/components/finance-engine/categorias'
import { createFinanceEngineRepositories } from '@/components/finance-engine/financeEngineRepository'
import { categoriaDe } from '@/components/finance-engine/mes'
import { db } from '@/lib/db/db'
import type { FinanceAccount, FinanceMovimiento, FinanceMovimientoTipo, FinanceGoal, FinanceIncomePeriod } from '@/types/finance'
import type { Moneda } from '@/components/finance-engine/extraccion'

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

/**
 * Sprint 040 — "Exportar Finanzas por mes" separado por origen: Mi
 * Proyecto tiene sus propias 4 tablas Dexie/Supabase
 * (mi_proyecto_finanzas_*, ver MiProyectoScreen.tsx), nunca mezcladas con
 * las de Finanzas general. Acá solo se necesita su repositorio de
 * movimientos — mismo `createFinanceEngineRepositories` que ya usa el
 * general arriba, ninguna lógica nueva. `'miproyecto'` es un id fijo hoy
 * (un solo espacio); el día que exista más de uno, `FinanzasOrigen` pasa
 * de union literal a algo parametrizado por id, sin tocar el resto de
 * esta función.
 */
const { movimientoRepository: movimientoRepositoryMiProyecto } = createFinanceEngineRepositories(
  db.miProyectoFinanceAccounts,
  db.miProyectoFinanceMovimientos,
  db.miProyectoFinanceGoals,
  db.miProyectoFinanceIncomePeriods,
)

export type FinanzasOrigen = 'general' | 'miproyecto'

export async function obtenerDatosParaExportar(): Promise<FinanzasExport> {
  const [movimientos, periodos, accounts, goals] = await Promise.all([
    movimientoRepository.list(),
    periodoRepository.list(),
    accountRepository.list(),
    goalRepository.list(),
  ])
  return { movimientos, periodos, accounts, goals }
}

/**
 * Ajustes — "Exportar Finanzas por mes" (CSV): a diferencia de
 * `obtenerDatosParaExportar` (backup completo en JSON, pensado para
 * restaurar), esto arma filas ya legibles para abrir en Excel/Sheets o
 * pegar en un chat a pedir un análisis de gastos — la categoría ya viene
 * en su label humano (CATEGORIA_LABEL), no el id interno, y `null`
 * ("Por revisar") no se manda vacío para no perderlo de vista en la
 * planilla. Filtra por `fecha.slice(0, 7)` (YYYY-MM, mismo formato que
 * devuelve `<input type="month">`) contra el rango [mesDesde, mesHasta]
 * inclusive — mismo criterio simple que ya usa `EntroDetalle.tsx` para
 * acotar por mes en vez de por semana de cobro real, porque acá lo que
 * importa es "qué pasó este mes calendario", no la semana de cobro.
 *
 * Sprint 040 — `origen` separa Finanzas general de Mi Proyecto: antes
 * mezclaba movimientos de las dos en un mismo CSV, ahora cada exportación
 * es de un solo origen, elegido en Ajustes.
 */
export interface FinanzasMovimientoExportCSV {
  fecha: string
  concepto: string
  categoria: string
  monto: number
  moneda: Moneda
  tipo: FinanceMovimientoTipo
}

export async function obtenerMovimientosParaExportarCSV(
  origen: FinanzasOrigen,
  mesDesde: string,
  mesHasta: string,
): Promise<FinanzasMovimientoExportCSV[]> {
  const repositorio = origen === 'miproyecto' ? movimientoRepositoryMiProyecto : movimientoRepository
  const movimientos = await repositorio.list()
  return movimientos
    .filter((m) => m.fecha.slice(0, 7) >= mesDesde && m.fecha.slice(0, 7) <= mesHasta)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m) => ({
      fecha: m.fecha,
      concepto: m.concepto,
      categoria: m.categoria ? CATEGORIA_LABEL[m.categoria] : 'Por revisar',
      monto: m.monto,
      moneda: m.moneda,
      tipo: m.tipo,
    }))
}

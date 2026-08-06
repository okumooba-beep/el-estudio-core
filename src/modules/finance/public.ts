import { useFinance } from './useFinance'
import { categoriaDe } from './mes'

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
 */
export const MODULE = { path: '/finanzas', label: 'Finanzas' }

/**
 * Señal de atención para Home (Sprint "Home refleja estado real de los
 * Espacios"): mismo criterio que ya usa FinanceScreen para "Por revisar"
 * (mes.ts, `categoriaDe(movimiento) === null` sobre egresos) — sin
 * acotar por mes, porque a Home le importa si existe algo pendiente,
 * no en qué mes cayó. Home recibe solo destino + mensaje, nunca la
 * lista de movimientos ni el criterio de categorización.
 */
export function useAttentionSignal(): { destino: 'finanzas'; mensaje: string } | null {
  const { movimientos } = useFinance()
  const hayPorRevisar = movimientos.some((movimiento) => movimiento.tipo === 'egreso' && categoriaDe(movimiento) === null)
  return hayPorRevisar ? { destino: 'finanzas', mensaje: 'Finanzas tiene un movimiento por revisar' } : null
}

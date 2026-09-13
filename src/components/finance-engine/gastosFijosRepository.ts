import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { FinanceCategoria } from './categorias'
import type { FinanceGastoFijo } from '@/types/finance'
import type { EntityTable } from 'dexie'

/**
 * "Gastos fijos mensuales" — repositorio propio, exclusivo de Finanzas
 * general (nunca instanciado desde Mi Proyecto). Sin `carpetaId` (no
 * scopea por carpeta) y sin `delete()`: el brief solo pide desactivar
 * (`activo`), nunca borrar — mismo criterio que `deletedAt` en otras
 * entidades, pero acá no hace falta ni el tombstone.
 */
export interface NuevaFinanceGastoFijo {
  nombre: string
  palabraClave: string
  categoria: FinanceCategoria | null
  montoEsperado?: number
}

export interface FinanceGastoFijoRepository extends Repository<FinanceGastoFijo> {
  list(): Promise<FinanceGastoFijo[]>
  add(input: NuevaFinanceGastoFijo): Promise<FinanceGastoFijo>
  update(id: string, patch: Partial<Omit<FinanceGastoFijo, 'id' | 'createdAt'>>): Promise<FinanceGastoFijo>
}

export function createGastosFijosRepository(
  table: EntityTable<FinanceGastoFijo, 'id'>,
): FinanceGastoFijoRepository {
  return {
    async list(): Promise<FinanceGastoFijo[]> {
      const gastos = await table.toArray()
      return gastos.sort((a, b) => a.nombre.localeCompare(b.nombre))
    },

    async add(input: NuevaFinanceGastoFijo): Promise<FinanceGastoFijo> {
      const now = new Date().toISOString()
      const gasto: FinanceGastoFijo = {
        id: generateId(),
        nombre: input.nombre.trim(),
        palabraClave: input.palabraClave.trim(),
        categoria: input.categoria,
        ...(input.montoEsperado !== undefined ? { montoEsperado: input.montoEsperado } : {}),
        activo: true,
        createdAt: now,
        updatedAt: now,
        pendingSync: true,
      }
      await table.add(gasto)
      return gasto
    },

    async update(id: string, patch: Partial<Omit<FinanceGastoFijo, 'id' | 'createdAt'>>): Promise<FinanceGastoFijo> {
      await table.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
      const updated = await table.get(id)
      if (!updated) throw new Error(`Gasto fijo ${id} no encontrado`)
      return updated
    },
  }
}

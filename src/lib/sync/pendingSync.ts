import type { EntityTable, IDType, InsertType, UpdateSpec } from 'dexie'

/**
 * Fase 1 (sync Supabase) — `pendingSync` (F5, ver shared-kernel/persistence/
 * Repository.ts) existe desde antes en toda entidad de Finanzas, escrito en
 * `true` en cada add()/update()/delete(). Nunca se indexó (IndexedDB no
 * soporta booleanos como índice), así que leer "lo pendiente" es un filtro
 * sobre toda la colección — mismo patrón que ya usa db.ts en migraciones
 * anteriores (ej. v17: `.filter((m) => m.tipo === 'ingreso')`).
 */
export async function readPending<T extends { pendingSync: boolean; id: string }>(
  table: EntityTable<T, 'id'>,
): Promise<T[]> {
  return table.toCollection().filter((row) => row.pendingSync).toArray()
}

export async function markSynced<T extends { pendingSync: boolean; id: string }>(
  table: EntityTable<T, 'id'>,
  ids: string[],
): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      table.update(id as IDType<T, 'id'>, { pendingSync: false } as unknown as UpdateSpec<InsertType<T, 'id'>>),
    ),
  )
}

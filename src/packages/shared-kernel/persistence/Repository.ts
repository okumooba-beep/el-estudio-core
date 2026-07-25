/**
 * Contrato mínimo y real (F4, ARCHITECTURE_RATIFIED.md): lo único que
 * `IdeaRepository`, `HabitCheckRepository` y `OperacionRepository`
 * comparten hoy es "leer todo lo que hay" sobre entidades con `id` y
 * `updatedAt`. Sus métodos de escritura (add/update/setChecked) tienen
 * formas genuinamente distintas por dominio — unificarlos acá sería
 * una abstracción especulativa, no un contrato real. Este mínimo es
 * exactamente lo que un futuro motor de sync (F5+) necesita para
 * recorrer cualquier repositorio de forma genérica.
 *
 * `pendingSync` (F5): marcado inerte — todo escritura local lo deja en
 * `true`. Nada lo lee ni lo limpia todavía; existe desde ahora para que
 * ningún módulo futuro tenga que reabrirse cuando el motor de sync real
 * (F6+) empiece a consumirlo.
 */
export interface SyncableEntity {
  id: string
  updatedAt: string
  pendingSync: boolean
}

export interface Repository<T extends SyncableEntity> {
  list(): Promise<T[]>
}

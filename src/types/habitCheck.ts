/**
 * Sprint 3.6 — Hábitos deja de ser una lista de hojas y pasa a ser un
 * registro semanal. Cada círculo guarda exactamente esto, nada más: ni
 * porcentajes ni rachas se derivan ni se persisten.
 *
 * `updatedAt` (F4, ARCHITECTURE_RATIFIED.md): mismo campo y misma
 * convención (ISO 8601 UTC) que ya tienen Idea y Operacion — necesario
 * para que HabitCheck también sea una entidad de contenido sincronizable.
 */
export interface HabitCheck {
  id: string
  habitId: string
  fecha: string
  checked: boolean
  updatedAt: string
  /** F5 (ARCHITECTURE_RATIFIED.md): marcado inerte — ver shared-kernel/persistence/Repository. */
  pendingSync: boolean
}

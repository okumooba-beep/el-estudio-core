/**
 * Sprint 3.5 — "La Mesa de Análisis": Trading deja de vivir en Idea.
 * Una operación no es un pensamiento sin hogar, nace con identidad
 * propia — instrumento, lado, resultado — igual que una operación real
 * en una planilla. Ideas y Operaciones nunca se mezclan ni se
 * convierten una en la otra.
 *
 * Una operación nunca se juzga, solo se observa: por eso no hay ningún
 * campo derivado (ganadora/perdedora, puntaje, racha) — solo lo que
 * pasó de verdad. reviewScore.ts y patterns.ts (ver src/lib/trading/)
 * son el único lugar reservado para cuando eso cambie.
 */
export type OperacionLado = 'long' | 'short'

/**
 * Sprint 3.6.1, parte 2: el checklist vive como datos, no como claves
 * fijas — cada operación puede tener sus propias reglas, en su propio
 * orden, editables sin salir del expediente.
 */
export interface ChecklistItem {
  readonly id: string
  readonly texto: string
  readonly checked: boolean
}

export type OperacionChecklist = readonly ChecklistItem[]

export interface Operacion {
  id: string
  fecha: string
  hora: string
  instrumento: string
  setup: string
  lado: OperacionLado
  resultadoPuntos: number
  resultadoUSD: number
  /** El archivo se guarda tal cual, sin optimizar (Sprint 3.5, parte 5) — todo local, nunca sube a internet. */
  imagen: Blob | null
  resumen: string
  emociones: string
  aprendizajes: string
  checklist: OperacionChecklist
  createdAt: string
  updatedAt: string
  /** F5 (ARCHITECTURE_RATIFIED.md): marcado inerte — ver shared-kernel/persistence/Repository. */
  pendingSync: boolean
}

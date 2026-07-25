/**
 * Motor de Comprensión (Sprint 2.1, relocado en F7): arquitectura
 * preparada para que un Rule Engine, un Embedding Engine y un LLM Engine
 * sean intercambiables sin que el resto del proyecto cambie una línea.
 * Por eso todo lo que vive fuera de este paquete depende de
 * ClassificationEngine, nunca de un proveedor concreto directamente.
 *
 * `TDestino` (F7): cognitive-engine no puede depender de ningún paquete
 * del proyecto (ARCHITECTURE_RATIFIED.md §3), así que el destino de una
 * clasificación nunca puede ser el tipo `IdeaDestino` importado —
 * el puerto queda genérico, igual que `Repository<T>` en shared-kernel.
 */
export interface ClassificationRule<TDestino extends string> {
  readonly id: string
  readonly keyword: string
  readonly destino: TDestino
}

/**
 * Por qué se propuso un destino (punto 05 — transparencia). Preparado
 * para poder responder "¿por qué propuse Misiones?" en el futuro; hoy
 * no se muestra en ninguna UI.
 */
export type ClassificationReason =
  | { readonly kind: 'aprendizaje'; readonly texto: string }
  | { readonly kind: 'regla'; readonly ruleId: string; readonly keyword: string }
  | { readonly kind: 'sin-coincidencia' }

export interface ClassificationResult<TDestino extends string> {
  readonly destino: TDestino
  readonly reason: ClassificationReason
}

export interface ClassificationEngine<TDestino extends string> {
  classify(texto: string): ClassificationResult<TDestino>
}

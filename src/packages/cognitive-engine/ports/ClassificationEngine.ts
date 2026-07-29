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
 *
 * Umbral V1 (Contrato del Umbral §6): el puerto pasa a expresar
 * confianza. Hasta este sprint el resultado era binario — había destino
 * o caía a 'hoy' — y el Umbral trataba todo match como certeza, lo que
 * lo llevaba a mover hojas por una sola palabra suelta. El cambio es
 * aditivo a propósito: `destino` y `reason` conservan su forma, así que
 * ningún consumidor fuera del camino del Umbral necesita tocarse.
 *
 * Deja obsoleta la línea de EL_ESTUDIO_BIBLE.md cap. 12 que cita
 * "nunca puntuación de confianza" como arquitectura vigente — esa
 * decisión del Sprint 2.1 queda revertida por el Contrato del Umbral.
 */
export interface ClassificationRule<TDestino extends string> {
  readonly id: string
  readonly keyword: string
  readonly destino: TDestino
}

/**
 * Señal estructural (Contrato §6): un patrón en el texto que vale más
 * que cualquier palabra suelta — hoy solo montos. Es la familia que
 * faltaba por completo: "Gasté $35.000" no disparaba nada mientras
 * "comprar" dentro de una negación sí movía la hoja.
 */
export interface StructuralRule<TDestino extends string> {
  readonly id: string
  readonly patron: RegExp
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
  | { readonly kind: 'estructura'; readonly ruleId: string }
  | { readonly kind: 'sin-coincidencia' }

/**
 * Contrato del Umbral §6. Los tres niveles son la única perilla del
 * sistema y gobiernan el comportamiento entero (§7):
 * alta → se asigna sola · media → se propone sin mover · baja → silencio.
 */
export type NivelConfianza = 'alta' | 'media' | 'baja'

export const UMBRAL_ALTA = 0.85
export const UMBRAL_BAJA = 0.35

export function nivelDeConfianza(confianza: number): NivelConfianza {
  if (confianza >= UMBRAL_ALTA) return 'alta'
  if (confianza >= UMBRAL_BAJA) return 'media'
  return 'baja'
}

export interface ClassificationResult<TDestino extends string> {
  readonly destino: TDestino
  readonly reason: ClassificationReason
  /** 0..1. Ver Contrato del Umbral §6 — nunca un número mágico: se deriva de las señales. */
  readonly confianza: number
  readonly nivel: NivelConfianza
  /**
   * El segundo lugar cuando hubo conflicto (Contrato §6, regla 3). Es lo
   * que permite proponer dos opciones en vez de una: "Pagué el gimnasio"
   * es Finanzas o Hábitos, y el Estudio pregunta en vez de elegir.
   */
  readonly alternativa: TDestino | null
}

export interface ClassificationEngine<TDestino extends string> {
  classify(texto: string): ClassificationResult<TDestino>
}

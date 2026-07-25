import type { ClassificationRule } from '../../ports/ClassificationEngine'

/**
 * Espejo exacto de `IdeaDestino` (ver src/types/idea.ts) — duplicado a
 * propósito, nunca importado: cognitive-engine no puede depender de
 * ningún paquete del proyecto (ARCHITECTURE_RATIFIED.md §3). Si
 * `IdeaDestino` cambia sus valores, este tipo debe actualizarse junto
 * con él.
 */
export type Destino = 'hoy' | 'misiones' | 'habitos' | 'trading' | 'finanzas' | 'biblioteca' | 'archivo'

/**
 * Reglas simples y transparentes (Sprint 2.1, punto 01): palabra clave
 * → destino, en ese orden, el primer match gana. Nunca IA, nunca
 * embeddings, nunca puntuación de confianza — cada regla se puede leer
 * en una línea. Agregar un destino nuevo es agregar una línea acá,
 * nunca tocar RuleBasedClassifier.ts.
 */
export const RULES: readonly ClassificationRule<Destino>[] = [
  { id: 'habito-meditar', keyword: 'meditar', destino: 'habitos' },
  { id: 'habito-gimnasio', keyword: 'gimnasio', destino: 'habitos' },
  { id: 'trading-nasdaq', keyword: 'nasdaq', destino: 'trading' },
  { id: 'trading-mnq', keyword: 'mnq', destino: 'trading' },
  { id: 'trading-sp500', keyword: 'sp500', destino: 'trading' },
  { id: 'mision-tribunales', keyword: 'tribunales', destino: 'misiones' },
  { id: 'mision-comprar', keyword: 'comprar', destino: 'misiones' },
  { id: 'mision-llamar', keyword: 'llamar', destino: 'misiones' },
  { id: 'mision-turno', keyword: 'turno', destino: 'misiones' },
  { id: 'finanzas-presupuesto', keyword: 'presupuesto', destino: 'finanzas' },
  { id: 'finanzas-factura', keyword: 'factura', destino: 'finanzas' },
  { id: 'finanzas-ahorro', keyword: 'ahorro', destino: 'finanzas' },
  { id: 'biblioteca-frase', keyword: 'frase', destino: 'biblioteca' },
  { id: 'archivo-archivar', keyword: 'archivar', destino: 'archivo' },
]

import { RULES, type Destino } from './rules'
import { getLearnedDestino } from './memory'
import type { ClassificationEngine, ClassificationResult } from '../../ports/ClassificationEngine'

export function normalizeTexto(texto: string): string {
  return texto.trim().toLowerCase()
}

/**
 * Motor de Comprensión v1 (Sprint 2.1): nunca IA, nunca embeddings,
 * nunca puntuación de confianza. Orden de decisión — lo que este
 * usuario ya corrigió antes (punto 04) pesa más que cualquier regla
 * genérica; después las reglas fijas (punto 01); si nada coincide, el
 * destino es Hoy sin comentario — el Estudio nunca adivina (punto 06).
 *
 * Implementa ClassificationEngine (ver ports/ClassificationEngine.ts) a
 * propósito: el resto del proyecto depende de esa interfaz, nunca de
 * esta clase. El día que exista un motor por embeddings o por LLM,
 * alcanza con registrar otra implementación en ProviderRegistry —
 * ningún otro archivo necesita cambiar.
 */
export class RuleBasedClassifier implements ClassificationEngine<Destino> {
  classify(texto: string): ClassificationResult<Destino> {
    const normalizado = normalizeTexto(texto)

    const aprendido = getLearnedDestino(normalizado)
    if (aprendido) {
      return { destino: aprendido, reason: { kind: 'aprendizaje', texto: normalizado } }
    }

    for (const rule of RULES) {
      if (normalizado.includes(rule.keyword)) {
        return { destino: rule.destino, reason: { kind: 'regla', ruleId: rule.id, keyword: rule.keyword } }
      }
    }

    return { destino: 'hoy', reason: { kind: 'sin-coincidencia' } }
  }
}

import {
  RULES,
  ESTRUCTURA,
  VERBOS_GASTO_PASADO,
  NEGADORES,
  PESO_LEXICO,
  PESO_MONTO,
  PESO_GASTO_PASADO,
  PESO_MONTO_Y_GASTO,
  BONO_CONVERGENCIA,
  UMBRAL_CONFLICTO,
  type Destino,
} from './rules'
import { getLearnedDestino } from './memory'
import {
  nivelDeConfianza,
  UMBRAL_ALTA,
  type ClassificationEngine,
  type ClassificationReason,
  type ClassificationResult,
} from '../../ports/ClassificationEngine'

export function normalizeTexto(texto: string): string {
  return texto.trim().toLowerCase()
}

const NEGADOR_RE = new RegExp(`(^|\\s)(${NEGADORES.map((n) => n.trim()).join('|')})\\s`)

/**
 * Una palabra clave precedida por un negador en la misma oración no
 * dispara (Contrato del Umbral §6). El límite es la cláusula, no el
 * texto entero: "Compré pan, no llamé a nadie" no debe anular
 * "compré". El negador se busca con borde de palabra para que "mano"
 * no cuente como "no".
 */
function estaNegado(texto: string, indice: number): boolean {
  const corte = Math.max(
    texto.lastIndexOf('.', indice),
    texto.lastIndexOf(',', indice),
    texto.lastIndexOf(';', indice),
  )
  return NEGADOR_RE.test(texto.slice(corte + 1, indice))
}

interface Acumulado {
  puntuacion: number
  reason: ClassificationReason
}

/**
 * Motor de Comprensión v2 (Umbral V1 — Contrato del Umbral §6/§7).
 *
 * Sigue sin ser IA y sin embeddings: son las mismas reglas legibles de
 * siempre. Lo que cambia es que ahora **puntúa** en vez de devolver el
 * primer match. El v1 trataba toda coincidencia como certeza, así que
 * una sola palabra suelta alcanzaba para que el Umbral mudara una hoja
 * de mueble — "No tengo que comprar nada" terminaba en Misiones y
 * "Gasté $35.000" no disparaba nada, porque no existían ni negaciones
 * ni señales estructurales.
 *
 * Orden de decisión:
 *   1. lo que este usuario ya corrigió antes (punto 04) — confianza alta;
 *   2. señales estructurales y sintácticas (montos, pretérito de gasto);
 *   3. reglas léxicas no negadas — nunca por sí solas confianza alta;
 *   4. si nada coincide, destino 'hoy' con confianza baja: la captura se
 *      queda en el Umbral y el Estudio no dice nada (punto 06).
 *
 * La regla que más protege al usuario es el conflicto (§6, regla 3): si
 * dos destinos puntúan fuerte, la confianza queda limitada a media por
 * mucho que gane el primero. "Pagué el gimnasio" es Finanzas o Hábitos,
 * y el Estudio prefiere preguntar una vez antes que equivocarse en
 * silencio.
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
      return {
        destino: aprendido,
        reason: { kind: 'aprendizaje', texto: normalizado },
        confianza: 1,
        nivel: 'alta',
        alternativa: null,
      }
    }

    const acumulado = new Map<Destino, Acumulado>()
    const sumar = (destino: Destino, puntuacion: number, reason: ClassificationReason) => {
      const previo = acumulado.get(destino)
      if (!previo) {
        acumulado.set(destino, { puntuacion, reason })
        return
      }
      // §6, regla 2: convergencia. La razón que se conserva es la de la
      // señal más fuerte — la que el usuario reconocería como el motivo.
      acumulado.set(destino, {
        puntuacion: Math.max(previo.puntuacion, puntuacion) + BONO_CONVERGENCIA,
        reason: previo.puntuacion >= puntuacion ? previo.reason : reason,
      })
    }

    const tieneGastoPasado = VERBOS_GASTO_PASADO.some((verbo) => normalizado.includes(verbo))

    for (const estructura of ESTRUCTURA) {
      if (!estructura.patron.test(normalizado)) continue
      sumar(estructura.destino, tieneGastoPasado ? PESO_MONTO_Y_GASTO : PESO_MONTO, {
        kind: 'estructura',
        ruleId: estructura.id,
      })
    }

    if (tieneGastoPasado && !acumulado.has('finanzas')) {
      sumar('finanzas', PESO_GASTO_PASADO, { kind: 'estructura', ruleId: 'finanzas-gasto-pasado' })
    }

    for (const rule of RULES) {
      const indice = normalizado.indexOf(rule.keyword)
      if (indice === -1) continue
      if (estaNegado(normalizado, indice)) continue
      sumar(rule.destino, rule.peso ?? PESO_LEXICO, { kind: 'regla', ruleId: rule.id, keyword: rule.keyword })
    }

    const ordenado = [...acumulado.entries()].sort(([, a], [, b]) => b.puntuacion - a.puntuacion)
    const primero = ordenado[0]
    if (!primero) {
      return {
        destino: 'hoy',
        reason: { kind: 'sin-coincidencia' },
        confianza: 0,
        nivel: 'baja',
        alternativa: null,
      }
    }

    const [destino, ganador] = primero
    const segundo = ordenado[1]

    let confianza = Math.min(ganador.puntuacion, 0.99)
    let alternativa: Destino | null = null

    // §6, regla 3: un conflicto nunca resuelve en alta, por muy fuerte
    // que sea el ganador.
    if (segundo && segundo[1].puntuacion >= UMBRAL_CONFLICTO) {
      confianza = Math.min(confianza, UMBRAL_ALTA - 0.01)
      alternativa = segundo[0]
    }

    return { destino, reason: ganador.reason, confianza, nivel: nivelDeConfianza(confianza), alternativa }
  }
}

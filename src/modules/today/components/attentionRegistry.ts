import { useAttentionSignal as useFinanzasAttention } from '@modules/finance/public'
import { useAttentionSignal as useAsuntosAttention } from '@modules/asuntos/public'
import type { IdeaDestino } from '@/types/idea'

/**
 * Sprint "Home refleja estado real de los Espacios": mecanismo mínimo y
 * reutilizable para que un módulo le diga a Home "acá hay algo que
 * atender", sin que Home conozca ningún estado interno del módulo
 * (nunca "Por revisar", nunca "Importante"). Un módulo solo entrega
 * destino + mensaje ya armados — mismo espíritu que `spaceRegistry.ts`
 * (Home tampoco arma ahí la lista de Espacios a mano).
 *
 * Agregar un futuro módulo (Trading, Biblioteca, Agenda) es sumar una
 * línea acá, nunca tocar Home: por eso este archivo existe separado de
 * HoyScreen.tsx.
 */
export interface AttentionSignal {
  destino: IdeaDestino
  mensaje: string
}

export function useAttentionSignals(): AttentionSignal[] {
  const finanzas = useFinanzasAttention()
  const asuntos = useAsuntosAttention()
  return [finanzas, asuntos].filter((signal): signal is AttentionSignal => signal !== null)
}

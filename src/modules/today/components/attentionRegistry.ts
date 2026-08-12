import { useAttentionSignal as useFinanzasAttention } from '@modules/finance/public'
import { useAttentionSignal as useAsuntosAttention } from '@modules/asuntos/public'
import type { AtencionAgenda } from '@modules/agenda/public'
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

/**
 * Sprint 015, punto 6: la prioridad pedida es 1) conflictos de Agenda,
 * 2) eventos urgentes, 3) el resto (Finanzas/Asuntos hoy). Agenda no
 * expone un `useAttentionSignal` propio como Finanzas/Asuntos porque su
 * estado ya se calculó una sola vez en `useAgendaHoy()` (HoyScreen) —
 * pedirlo de nuevo acá repetiría la carga de IndexedDB (useAgenda no es
 * un singleton). Por eso este registro recibe `atencion` ya resuelta.
 */
function agendaSignal(atencion: AtencionAgenda): AttentionSignal | null {
  if (atencion.conflictoTexto) return { destino: 'agenda', mensaje: `Conflicto de horario con ${atencion.conflictoTexto}` }
  if (atencion.hayEventoUrgente) return { destino: 'agenda', mensaje: 'Hay un evento urgente hoy' }
  return null
}

export function useAttentionSignals(atencion: AtencionAgenda): AttentionSignal[] {
  const finanzas = useFinanzasAttention()
  const asuntos = useAsuntosAttention()
  const señales: (AttentionSignal | null)[] = [agendaSignal(atencion), finanzas, asuntos]
  return señales.filter((signal): signal is AttentionSignal => signal !== null)
}

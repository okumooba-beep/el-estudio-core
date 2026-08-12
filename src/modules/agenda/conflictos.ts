import { extraerRangoHora } from './extraccionFecha'
import type { AgendaEvento, AgendaBloque } from '@/types/agenda'

/**
 * Sprint 013, punto 7: con `<` estricto, un Evento-punto (inicio===fin)
 * que arranca justo en el mismo instante en que empieza un Bloque no
 * detectaba el conflicto ("Juramentación 10:30" dentro de "Trading
 * 10:30–13:15" no disparaba nada, porque `b.inicio < a.fin` fallaba con
 * `10:30 < 10:30`). Con `<=` un instante que cae en el borde de inicio
 * del otro rango también cuenta como solapamiento.
 */
export function seSuperponen(a: { inicio: string; fin: string }, b: { inicio: string; fin: string }): boolean {
  return a.inicio <= b.fin && b.inicio <= a.fin
}

/**
 * Sprint 012, punto 3: rango recalculado al vuelo (extraerRangoHora, no
 * persistido) para detectar solapamiento Evento/Bloque dentro de un
 * mismo día — nunca decide automáticamente, solo marca cuáles chocan.
 *
 * Sprint 015: separado de AgendaScreen.tsx (antes vivía ahí, privado)
 * para que agenda/public.ts pueda ofrecerle a Home el mismo cálculo sin
 * duplicar la lógica.
 */
export function calcularConflictosDia(eventosDelDia: readonly AgendaEvento[], bloquesDelDia: readonly AgendaBloque[]) {
  const conflictosPorEvento = new Map<string, AgendaBloque[]>()
  const bloqueIdsEnConflicto = new Set<string>()
  for (const evento of eventosDelDia) {
    const rangoEvento = extraerRangoHora(evento.texto)
    if (!rangoEvento) continue
    const enConflicto = bloquesDelDia.filter((bloque) => {
      const rangoBloque = extraerRangoHora(bloque.texto)
      return rangoBloque !== null && seSuperponen(rangoEvento, rangoBloque)
    })
    if (enConflicto.length > 0) {
      conflictosPorEvento.set(evento.id, enConflicto)
      for (const bloque of enConflicto) bloqueIdsEnConflicto.add(bloque.id)
    }
  }
  return { conflictosPorEvento, bloqueIdsEnConflicto }
}

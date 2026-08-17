import type { AtencionAgenda, ResumenHoy } from '@modules/agenda/public'
import { fraseHoy } from './hoyFrase'

interface FraseHoyProps {
  atencion: AtencionAgenda
  resumen: ResumenHoy
  ready: boolean
}

/**
 * Sprint 015 ("Home como eje del día"), punto 3: PhraseSlot.tsx volvió a
 * convivir con esta frase desde Sprint 015.1 — ver el comentario de ese
 * componente para el porqué de que las dos existan a la vez ("¿qué es
 * este lugar?" vs. "¿cómo está mi día?"). PhraseSlot.tsx sigue
 * existiendo sin importar de acá, mismo criterio ya usado con
 * MisionPrincipal/HabitsGlance/RecentActivity.
 *
 * Sprint 018: `mt-1.5` (heredado de cuando esta frase vivía sola, sin
 * PhraseSlot arriba) dejaba casi pegadas dos frases con tipografía antes
 * idéntica. Ahora que PhraseSlot se diferencia tipográficamente (itálica,
 * --ink-faint), este espacio crece para que la separación visual entre
 * las dos voces no dependa solo del estilo del texto.
 */
export function FraseHoy({ atencion, resumen, ready }: FraseHoyProps) {
  if (!ready) return null
  return <p className="mt-3.5 max-w-[38ch] text-[15px] text-ink-dim">{fraseHoy(atencion, resumen)}</p>
}

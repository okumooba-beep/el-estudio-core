import type { AtencionAgenda, ResumenHoy } from '@modules/agenda/public'
import { fraseHoy } from './hoyFrase'

interface FraseHoyProps {
  atencion: AtencionAgenda
  resumen: ResumenHoy
  ready: boolean
}

/**
 * Sprint 015 ("Home como eje del día"), punto 3: reemplaza a
 * PhraseSlot.tsx en HoyScreen — esa frase es la voz ambiental de las
 * Ideas guardadas (voiceEngine), un mecanismo distinto que no lee
 * Agenda ni Misiones. Mostrar las dos a la vez pondría dos frases
 * compitiendo por atención en el mismo bloque (punto 1: "una sola
 * pregunta"), así que esta la reemplaza en el flujo de Hoy.
 * PhraseSlot.tsx sigue existiendo sin importar de acá, mismo criterio
 * ya usado con MisionPrincipal/HabitsGlance/RecentActivity.
 */
export function FraseHoy({ atencion, resumen, ready }: FraseHoyProps) {
  if (!ready) return null
  return <p className="mt-1.5 max-w-[38ch] text-[15px] text-ink-dim">{fraseHoy(atencion, resumen)}</p>
}

import { useMemo } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { resolveVoice } from '@/lib/voice/voiceEngine'

/**
 * El silencio es el resultado más frecuente de resolveVoice(), no un caso
 * de error: cuando no hay nada que mostrar, este componente no renderiza
 * nada — ni un espacio vacío reservado, ni un placeholder.
 *
 * Sprint 018 ("Home: recuperar el lugar"): esta frase y la de FraseHoy
 * (la lectura determinista del día) compartían tipografía idéntica —
 * mismo tamaño, mismo color, casi pegadas — y se leían como una sola
 * oración partida en dos líneas en vez de dos voces distintas. Acá se
 * marca como la voz ambiental (itálica, un escalón más chica, --ink-faint
 * en vez de --ink-dim, el tono más apagado que ya usa el resto de la app
 * para texto secundario) para que FraseHoy quede como la lectura
 * funcional y legible del día.
 *
 * Sprint 021 ("Frase ambiental — sacarla del flujo funcional"): ahora vive
 * al cierre de HoyScreen, no pegada al saludo. Centrada (en vez de alineada
 * a la izquierda como todo el contenido funcional) y con más aire arriba
 * para que se lea como una presencia aparte del último bloque funcional
 * (Atención), no como su continuación.
 *
 * Bug reportado (2026-09-29): --ink-faint suelto sobre la foto del cuarto
 * se leía casi invisible, y en días con pocos bloques (sin Atención, sin
 * Misión) el mt fijo la dejaba pegada arriba, cerca del saludo, en vez de
 * leerse como el cierre de la pantalla. La píldora con vidrio esmerilado
 * que se probó para resolver la legibilidad (sprint 021) tapaba la foto y
 * se veía tosca — se volvió al texto suelto, solo con un text-shadow
 * (.frase-ambiental-scrim, ver index.css) y opacidad algo mayor que la
 * original para legibilidad, sin contenedor. El margen superior (mt-12)
 * se mantiene para separarla del contenido funcional.
 */
export function PhraseSlot() {
  const { ideas } = useIdeas()
  const entry = useMemo(() => resolveVoice(ideas), [ideas])
  if (!entry) return null

  return (
    <p className="frase-ambiental-scrim mx-auto mt-12 max-w-[32ch] text-center text-[13px] italic leading-relaxed text-ink-dim opacity-75">
      {entry.text}
    </p>
  )
}

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
 * leerse como el cierre de la pantalla. Dos cambios, mismo criterio que ya
 * resolvió esto en Ajustes (ver .ajustes-superficie en index.css): la
 * frase pasa a vivir dentro de una píldora con el mismo vidrio esmerilado
 * (.frase-ambiental-scrim) en vez de flotar directo sobre la foto, y el
 * margen superior crece (mt-4 → mt-12) para separarla más del contenido
 * funcional y correrla hacia la mitad inferior de la pantalla.
 */
export function PhraseSlot() {
  const { ideas } = useIdeas()
  const entry = useMemo(() => resolveVoice(ideas), [ideas])
  if (!entry) return null

  return (
    <p className="frase-ambiental-scrim mx-auto mt-12 max-w-[32ch] px-4 py-2.5 text-center text-[13px] italic leading-relaxed text-ink-dim">
      {entry.text}
    </p>
  )
}

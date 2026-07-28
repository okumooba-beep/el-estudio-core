import { useEffect, useMemo, useRef, useState } from 'react'
import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import { useIdeas } from './useIdeas'
import { DeskPaperStack } from './DeskPaperStack'
import { IdeaSheet } from './IdeaSheet'
import { comprehensionEngine } from '@/app/shell/comprehensionEngine'
import { normalizeTexto } from '@cognitive-engine/providers/rule-based/RuleBasedClassifier'
import { learnCorrection } from '@cognitive-engine/providers/rule-based/memory'
import { recordClassification } from '@cognitive-engine/providers/rule-based/log'
import { MUEBLES } from '@world/studio/muebles'
import { setGaze } from '@world/world/gaze'
import { WORLD_PLACES } from '@world/world/worldMap'
import { DESTINO_TO_FURNITURE, FURNITURE_TO_DESTINO } from './destinoFurniture'
import type { ClassificationReason } from '@cognitive-engine/ports/ClassificationEngine'
import type { IdeaDestino } from '@/types/idea'
import type { FurnitureId } from '@world/studio/furniture'

const DRAFT_KEY = 'idea-draft'

/** Cuánto descansa una idea recién guardada antes de que aparezca la propuesta, en silencio. */
const PROPOSAL_DELAY_MS = 2200
/** Si nadie la toca, la propuesta se retira sola — el destino ya elegido queda como está. */
const PROPOSAL_TIMEOUT_MS = 9000

/**
 * Sprint 3.6 (revisión), parte 6: solo los muebles que ya existen de
 * verdad — nunca Biblioteca ni Finanzas, todavía reservados. "Diario"
 * reemplaza a "Hoy": elegirlo no muda a ningún mueble especial, porque
 * la hoja ya vive para siempre en el Diario (ver moveSheet/history).
 */
const CORRECCION_DESTINOS: readonly { id: FurnitureId; label: string }[] = [
  { id: 'tablero', label: 'Misiones' },
  { id: 'habitos', label: 'Hábitos' },
  { id: 'mesa-analisis', label: 'Trading' },
  { id: 'escritorio', label: 'Cuaderno' },
]

/**
 * Voice of El Estudio — un solo texto para "qué cree el clasificador",
 * usado tanto antes de guardar (vista previa en vivo) como después
 * (la propuesta). Corto, sin "Esto"/"Creo que": el Estudio observa y
 * dice lo que ve, nunca se explica de más. "Cambiar destino" (más abajo)
 * es la invitación explícita a corregir — nunca un texto que hay que
 * adivinar que se puede tocar.
 */
const DESTINO_PREVIEW_MESSAGE: Record<IdeaDestino, string> = {
  hoy: 'Se queda como idea.',
  misiones: 'Parece una misión.',
  habitos: 'Parece un hábito.',
  trading: 'Parece una nota de trading.',
  finanzas: 'Parece algo de finanzas.',
  biblioteca: 'Parece una frase para la biblioteca.',
  archivo: 'Parece algo para archivar.',
}

interface Proposal {
  ideaId: string
  texto: string
  destinoPropuesto: IdeaDestino
  reason: ClassificationReason
  expanded: boolean
}

/**
 * Esta es la única puerta (Sprint 2.2, regla "Todo pensamiento entra
 * por una sola puerta"): nunca va a existir un formulario propio para
 * Misiones, Hábitos, Trading, Finanzas o Biblioteca. Todo empieza acá
 * como una Idea sin hogar, y el Escritorio (antes "Hoy" — ver
 * src/packages/world/studio/muebles.ts) es el mueble donde vive mientras tanto.
 *
 * Desde Sprint 2.1 el Estudio ya no pregunta primero — observa el texto
 * con el Motor de Comprensión (ver src/packages/cognitive-engine/) y, solo si
 * reconoce algo, propone en silencio dónde cree que vive. Si no
 * reconoce nada, no dice nada — la idea se queda en el Escritorio sin
 * comentario (el Estudio nunca adivina), y ahí se queda para siempre si
 * nadie la mueve: el Motor clasifica una sola vez, al nacer la Idea, y
 * nunca vuelve más tarde a insistir con una que ya lleva días sin hogar
 * (Sprint 2.2, punto 07 — el Estudio nunca presiona).
 *
 * Tocar la propuesta despliega la corrección — solo Hoy, Misiones,
 * Hábitos y Trading (los únicos destinos con evidencia real todavía).
 * Corregir enseña esa preferencia en este dispositivo, nunca más allá
 * (ver src/packages/cognitive-engine/providers/rule-based/memory.ts), para la próxima vez que
 * aparezca el mismo texto exacto.
 *
 * El Escritorio no es una lista (Sprint 2.2, punto 02 — cierre de la
 * auditoría del Sprint 2.1): puede haber varias Ideas sin hogar a la
 * vez, y todas siguen vivas en IndexedDB, pero acá solo se ve una pila
 * física de hasta 4 (ver DeskPaperStack). Cuando una Idea encuentra
 * hogar no hace fade ni se borra — su `destino` cambia y simplemente
 * deja de pertenecer a esta pila, porque ya vive en otro mueble.
 *
 * Sprint "The Gaze": onFocus en el input, no onChange — la mirada se
 * decide al entrar por la única puerta, antes de escribir la primera
 * letra (ver src/packages/world/world/gaze.ts). Todavía no mueve ni anima nada;
 * solo dice que la atención ya pertenece al Escritorio.
 *
 * Sprint "Crossing the Threshold": onBlur es el regreso — dejar esta
 * puerta limpia la mirada, nunca un botón "salir" ni una ruta nueva.
 * El destino usa WORLD_PLACES.escritorio.id (ver
 * src/packages/world/world/worldMap.ts), nunca el literal 'escritorio' suelto:
 * el mapa del mundo es la fuente de verdad de qué lugares existen,
 * este archivo solo la consulta.
 */
export function IdeaCapture() {
  const { ideas, add, moveSheet } = useIdeas()
  const [value, setValue] = useState(() => readJSON(DRAFT_KEY, ''))
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const proposalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const preclasificacion = useMemo(() => {
    const texto = value.trim()
    if (!texto) return null
    return comprehensionEngine.classify(texto).destino
  }, [value])

  const hoyIdeas = ideas.filter((idea) => idea.destino === 'hoy')
  const propuesta = proposal ? ideas.find((idea) => idea.id === proposal.ideaId) : undefined
  const abierta = openedId ? hoyIdeas.find((idea) => idea.id === openedId) : undefined
  const activa = propuesta ?? abierta ?? hoyIdeas[0]

  useEffect(() => {
    return () => {
      if (proposalTimer.current) clearTimeout(proposalTimer.current)
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  function clearProposalState() {
    setProposal(null)
    if (proposalTimer.current) clearTimeout(proposalTimer.current)
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
  }

  function handleChange(text: string) {
    setValue(text)
    writeJSON(DRAFT_KEY, text)
    if (text.trim() && proposal) clearProposalState()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const texto = value.trim()
    if (!texto) return

    clearProposalState()
    setOpenedId(null)

    const created = await add(texto)
    setValue('')
    writeJSON(DRAFT_KEY, '')
    // Core V3 — "si algo interrumpe la escritura, sacarlo": guardar con
    // el botón (a diferencia de Enter) le saca el foco al input; sin
    // esto, escribir la siguiente idea pedía un segundo toque.
    inputRef.current?.focus()

    // Threshold V1 — "guardar debe sentirse satisfactorio": el mismo
    // borde/sombra cálidos que ya existen para focus-within (abajo) se
    // reusan acá, disparados un instante después de guardar en vez de
    // solo al enfocar. Ningún componente ni color nuevo.
    setJustSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setJustSaved(false), 900)

    const { destino, reason } = comprehensionEngine.classify(texto)
    if (destino === 'hoy') return

    proposalTimer.current = setTimeout(() => {
      // La propuesta siempre debe aparecer, incluso si mover la hoja
      // falla o tarda (Sprint 3.2, prioridad 2) — por eso ya no se
      // espera assignDestino antes de mostrarla.
      setProposal({ ideaId: created.id, texto, destinoPropuesto: destino, reason, expanded: false })
      moveSheet(created, DESTINO_TO_FURNITURE[destino]).catch((error) => {
        console.error('No se pudo mover la hoja al mueble propuesto', error)
      })
      dismissTimer.current = setTimeout(() => {
        recordClassification({
          texto,
          destinoPropuesto: destino,
          destinoElegido: destino,
          reason,
          fecha: new Date().toISOString(),
        })
        setProposal(null)
      }, PROPOSAL_TIMEOUT_MS)
    }, PROPOSAL_DELAY_MS)
  }

  function handleToggleExpand() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    setProposal((current) => (current ? { ...current, expanded: !current.expanded } : current))
  }

  async function handleCorreccion(furniture: FurnitureId) {
    if (!proposal) return
    const idea = ideas.find((i) => i.id === proposal.ideaId)
    if (!idea) return
    if (dismissTimer.current) clearTimeout(dismissTimer.current)

    const destino = FURNITURE_TO_DESTINO[furniture] ?? idea.destino
    await moveSheet(idea, furniture)
    if (destino !== proposal.destinoPropuesto) {
      learnCorrection(normalizeTexto(proposal.texto), destino)
    }
    recordClassification({
      texto: proposal.texto,
      destinoPropuesto: proposal.destinoPropuesto,
      destinoElegido: destino,
      reason: proposal.reason,
      fecha: new Date().toISOString(),
    })
    setProposal(null)
  }

  return (
    <div className="flex flex-col gap-3" data-mueble={MUEBLES.hoy}>
      {activa ? (
        <DeskPaperStack ideas={hoyIdeas} activeId={activa.id} onOpen={setOpenedId}>
          <IdeaSheet idea={activa} open={Boolean(propuesta)} />
          {propuesta && proposal ? (
            <p className="idea-proposal">
              {DESTINO_PREVIEW_MESSAGE[proposal.destinoPropuesto]}{' '}
              <button type="button" className="idea-proposal-target" onClick={handleToggleExpand}>
                Cambiar destino
              </button>
            </p>
          ) : null}
          {propuesta && proposal?.expanded ? (
            <div className="idea-destinos" role="group" aria-label="Corregir destino">
              {CORRECCION_DESTINOS.map((destino) => (
                <button
                  key={destino.id}
                  type="button"
                  className="idea-destino"
                  onClick={() => handleCorreccion(destino.id)}
                >
                  {destino.label}
                </button>
              ))}
            </div>
          ) : null}
        </DeskPaperStack>
      ) : null}
      <form
        onSubmit={handleSubmit}
        className={[
          'flex items-center gap-3 border-b pb-4 transition-[border-color,box-shadow] duration-300 ease-out focus-within:border-accent/70 focus-within:shadow-[0_1px_0_0_rgba(216,162,74,0.3)] motion-reduce:transition-none',
          justSaved ? 'border-accent/70 shadow-[0_1px_0_0_rgba(216,162,74,0.3)]' : 'border-border/60',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setGaze(WORLD_PLACES.escritorio.id)}
          onBlur={() => setGaze(null)}
          aria-label="Idea"
          placeholder="¿Qué tenés en mente?"
          className="min-w-0 flex-1 bg-transparent px-1 py-4 text-[21px] leading-relaxed text-ink caret-accent outline-none placeholder:text-ink-dim"
        />
        {value.trim() ? (
          <button type="submit" className="accion-primaria shrink-0 px-3.5 py-2 text-[13.5px]">
            Guardar
          </button>
        ) : null}
      </form>
      {justSaved ? (
        <p className="px-1 text-[12.5px] text-ink-faint" aria-live="polite">
          Guardado.
        </p>
      ) : preclasificacion ? (
        <p className="px-1 text-[12.5px] text-ink-faint" aria-live="polite">
          {DESTINO_PREVIEW_MESSAGE[preclasificacion]}
        </p>
      ) : null}
    </div>
  )
}

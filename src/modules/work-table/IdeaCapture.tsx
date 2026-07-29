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
import type { ClassificationReason, NivelConfianza } from '@cognitive-engine/ports/ClassificationEngine'
import type { IdeaDestino } from '@/types/idea'
import type { FurnitureId } from '@world/studio/furniture'

const DRAFT_KEY = 'idea-draft'

/** Cuánto descansa una captura recién guardada antes de que aparezca la propuesta, en silencio. */
const PROPOSAL_DELAY_MS = 2200

/**
 * Umbral V1 (Contrato del Umbral §7): los siete destinos, siempre. Antes
 * solo había cuatro, así que una hoja mandada por error a Finanzas o
 * Biblioteca no se podía corregir desde la propuesta — la
 * reversibilidad del §1 se rompía justo donde más importaba. "Cuaderno"
 * apunta al escritorio: la hoja se queda donde está.
 */
const CORRECCION_DESTINOS: readonly { id: FurnitureId; label: string }[] = [
  { id: 'tablero', label: 'Misiones' },
  { id: 'habitos', label: 'Hábitos' },
  { id: 'mesa-analisis', label: 'Trading' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'archivador', label: 'Archivo' },
  { id: 'escritorio', label: 'Cuaderno' },
]

/**
 * Voice of El Estudio — qué cree el clasificador, en vista previa y en
 * la propuesta de confianza media. Corto, sin "Esto"/"Creo que": el
 * Estudio observa y dice lo que ve, nunca se explica de más.
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

/**
 * Confianza alta: la hoja ya se mudó, así que el texto lo cuenta en
 * pasado en vez de preguntar. No es una pregunta pendiente — es un
 * hecho reversible.
 */
const DESTINO_ASIGNADO_MESSAGE: Record<IdeaDestino, string> = {
  hoy: 'Se queda como idea.',
  misiones: 'Vive en Misiones.',
  habitos: 'Vive en Hábitos.',
  trading: 'Vive en Trading.',
  finanzas: 'Vive en Finanzas.',
  biblioteca: 'Vive en la Biblioteca.',
  archivo: 'Vive en el Archivo.',
}

const DESTINO_LABEL: Record<IdeaDestino, string> = {
  hoy: 'Cuaderno',
  misiones: 'Misiones',
  habitos: 'Hábitos',
  trading: 'Trading',
  finanzas: 'Finanzas',
  biblioteca: 'Biblioteca',
  archivo: 'Archivo',
}

interface Proposal {
  ideaId: string
  texto: string
  destinoPropuesto: IdeaDestino
  /** Contrato §7: 'alta' ya movió la hoja y esto lo informa; 'media' todavía no movió nada. */
  nivel: NivelConfianza
  alternativa: IdeaDestino | null
  reason: ClassificationReason
  expanded: boolean
}

/**
 * Esta es la única puerta (Sprint 2.2, regla "Todo pensamiento entra
 * por una sola puerta"): nunca va a existir un formulario propio para
 * Misiones, Hábitos, Trading, Finanzas o Biblioteca. Todo empieza acá
 * como una captura sin hogar, y el Escritorio (antes "Hoy" — ver
 * src/packages/world/studio/muebles.ts) es el mueble donde vive mientras tanto.
 *
 * Umbral V1 — los tres comportamientos del Contrato del Umbral §7. Hasta
 * este sprint el Umbral hacía exactamente lo que el Contrato prohíbe:
 * llamaba a moveSheet() apenas una regla coincidía y recién después
 * mostraba la "propuesta", así que lo que parecía una pregunta era en
 * realidad un deshacer sobre una hoja ya mudada. Y a los 9 segundos, si
 * nadie reaccionaba, escribía en el log `destinoElegido: destino` — el
 * silencio quedaba registrado como una decisión del usuario.
 *
 * Ahora:
 *   alta  → la hoja se mueve sola y el Estudio lo informa en pasado;
 *   media → NO se mueve nada; la propuesta espera indefinidamente;
 *   baja  → silencio, la captura se queda en el Escritorio.
 *
 * La propuesta ya no expira. Si la ignorás, no pasa nada — ni ahora ni
 * en tres meses (Contrato §11: el Umbral limita la visibilidad, nunca
 * la existencia). Y nada se escribe en el log de clasificación salvo
 * que el usuario haya hecho algo: confirmar, corregir, o que el propio
 * Estudio haya asignado por confianza alta (registrado con
 * `destinoElegido: null`, porque el usuario todavía no se pronunció).
 *
 * Corregir enseña esa preferencia en este dispositivo, nunca más allá
 * (ver src/packages/cognitive-engine/providers/rule-based/memory.ts), para la próxima vez que
 * aparezca el mismo texto exacto.
 *
 * El Escritorio no es una lista (Sprint 2.2, punto 02): puede haber
 * varias capturas sin hogar a la vez, y todas siguen vivas en
 * IndexedDB, pero acá solo se ve una pila física de hasta 4 (ver
 * DeskPaperStack).
 *
 * Sprint "The Gaze": onFocus en el input, no onChange — la mirada se
 * decide al entrar por la única puerta. Sprint "Crossing the Threshold":
 * onBlur es el regreso; el destino usa WORLD_PLACES.escritorio.id, nunca
 * el literal 'escritorio' suelto.
 */
export function IdeaCapture() {
  const { ideas, add, moveSheet } = useIdeas()
  const [value, setValue] = useState(() => readJSON(DRAFT_KEY, ''))
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const proposalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const preclasificacion = useMemo(() => {
    const texto = value.trim()
    if (!texto) return null
    const { destino, nivel } = comprehensionEngine.classify(texto)
    // Contrato §7: con confianza baja el Estudio no dice nada. Tampoco
    // mientras escribís.
    return nivel === 'baja' ? null : destino
  }, [value])

  const hoyIdeas = ideas.filter((idea) => idea.destino === 'hoy')
  const propuesta = proposal ? ideas.find((idea) => idea.id === proposal.ideaId) : undefined
  const abierta = openedId ? hoyIdeas.find((idea) => idea.id === openedId) : undefined
  const activa = propuesta ?? abierta ?? hoyIdeas[0]

  useEffect(() => {
    return () => {
      if (proposalTimer.current) clearTimeout(proposalTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  function clearProposalState() {
    setProposal(null)
    if (proposalTimer.current) clearTimeout(proposalTimer.current)
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
    // el botón (a diferencia de Enter) le saca el foco al input.
    inputRef.current?.focus()

    // Threshold V1 — "guardar debe sentirse satisfactorio".
    setJustSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setJustSaved(false), 900)

    const { destino, reason, nivel, alternativa } = comprehensionEngine.classify(texto)

    // Contrato §7, confianza baja: silencio. Ni propuesta, ni etiqueta,
    // ni movimiento. Un Umbral con capturas sin clasificar es un Umbral
    // honesto.
    if (nivel === 'baja') return

    proposalTimer.current = setTimeout(() => {
      setProposal({
        ideaId: created.id,
        texto,
        destinoPropuesto: destino,
        nivel,
        alternativa,
        reason,
        expanded: false,
      })

      // Contrato §7: SOLO la confianza alta mueve la hoja. Con media, la
      // propuesta se muestra y la captura sigue en el Escritorio hasta
      // que el usuario confirme.
      if (nivel !== 'alta') return

      moveSheet(created, DESTINO_TO_FURNITURE[destino]).catch((error) => {
        console.error('No se pudo mover la hoja al mueble propuesto', error)
      })
      recordClassification({
        texto,
        destinoPropuesto: destino,
        destinoElegido: null,
        reason,
        fecha: new Date().toISOString(),
      })
    }, PROPOSAL_DELAY_MS)
  }

  function handleToggleExpand() {
    setProposal((current) => (current ? { ...current, expanded: !current.expanded } : current))
  }

  /** Contrato §7, confianza media: recién acá se mueve la hoja. */
  async function handleConfirmar(destino: IdeaDestino) {
    if (!proposal) return
    const idea = ideas.find((i) => i.id === proposal.ideaId)
    if (!idea) return

    await moveSheet(idea, DESTINO_TO_FURNITURE[destino])
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

  async function handleCorreccion(furniture: FurnitureId) {
    if (!proposal) return
    const idea = ideas.find((i) => i.id === proposal.ideaId)
    if (!idea) return

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
              {proposal.nivel === 'alta'
                ? DESTINO_ASIGNADO_MESSAGE[proposal.destinoPropuesto]
                : DESTINO_PREVIEW_MESSAGE[proposal.destinoPropuesto]}{' '}
              {proposal.nivel === 'media' ? (
                <>
                  <button
                    type="button"
                    className="idea-proposal-target"
                    onClick={() => handleConfirmar(proposal.destinoPropuesto)}
                  >
                    Confirmar
                  </button>
                  {proposal.alternativa ? (
                    <>
                      {' · '}
                      <button
                        type="button"
                        className="idea-proposal-target"
                        onClick={() => handleConfirmar(proposal.alternativa as IdeaDestino)}
                      >
                        {DESTINO_LABEL[proposal.alternativa]}
                      </button>
                    </>
                  ) : null}
                  {' · '}
                </>
              ) : null}
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
          'flex items-center gap-3 border-b pb-4 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-accent/70 focus-within:shadow-[0_1px_0_0_rgba(216,162,74,0.3)] motion-reduce:transition-none',
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

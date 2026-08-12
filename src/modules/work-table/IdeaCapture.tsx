import { useEffect, useMemo, useRef, useState } from 'react'
import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import { useIdeas } from './useIdeas'
import { DeskPaperStack } from './DeskPaperStack'
import { IdeaSheet } from './IdeaSheet'
import { comprehensionEngine } from '@/app/shell/comprehensionEngine'
import { interpretar, etiquetaFecha, formatearHora12, type Prioridad } from '@shared-kernel/text/interpretarTexto'
import { normalizeTexto } from '@cognitive-engine/providers/rule-based/RuleBasedClassifier'
import { learnCorrection } from '@cognitive-engine/providers/rule-based/memory'
import { recordClassification } from '@cognitive-engine/providers/rule-based/log'
import { MUEBLES } from '@world/studio/muebles'
import { setGaze } from '@world/world/gaze'
import { WORLD_PLACES } from '@world/world/worldMap'
import { DESTINO_TO_FURNITURE, FURNITURE_TO_DESTINO } from './destinoFurniture'
import type { ClassificationReason, NivelConfianza } from '@cognitive-engine/ports/ClassificationEngine'
import type { Idea, IdeaDestino } from '@/types/idea'
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
  { id: 'bandeja', label: 'Asuntos' },
  { id: 'habitos', label: 'Hábitos' },
  { id: 'mesa-analisis', label: 'Trading' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'agenda', label: 'Agenda' },
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
  asuntos: 'Parece un asunto abierto.',
  habitos: 'Parece un hábito.',
  trading: 'Parece una nota de trading.',
  finanzas: 'Parece algo de finanzas.',
  agenda: 'Parece algo con fecha y hora.',
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
  asuntos: 'Vive en Asuntos.',
  habitos: 'Vive en Hábitos.',
  trading: 'Vive en Trading.',
  finanzas: 'Vive en Finanzas.',
  agenda: 'Vive en Agenda.',
  biblioteca: 'Vive en la Biblioteca.',
  archivo: 'Vive en el Archivo.',
}

const DESTINO_LABEL: Record<IdeaDestino, string> = {
  hoy: 'Cuaderno',
  misiones: 'Misiones',
  asuntos: 'Asuntos',
  habitos: 'Hábitos',
  trading: 'Trading',
  finanzas: 'Finanzas',
  agenda: 'Agenda',
  biblioteca: 'Biblioteca',
  archivo: 'Archivo',
}

function rotuloPrioridad(prioridad: Prioridad): string {
  return prioridad === 'urgente' ? 'Urgente' : 'Importante'
}

/**
 * Sprint 014, punto 3. Agenda por convención siempre tiene una fecha (si
 * el texto no trae una, el mismo default a "hoy" que ya aplica
 * modules/agenda/extraccionFecha.ts al crear el Evento) — Misiones nunca
 * inventa una, así que sin señal de fecha no hay línea estructurada para
 * mostrar y se cae al mensaje genérico de una línea.
 */
function vistaPreviaEstructurada(destino: 'agenda' | 'misiones', texto: string): string | null {
  const hoyISO = new Date().toISOString().slice(0, 10)
  const { fecha, hora, prioridad } = interpretar(texto, hoyISO)

  if (destino === 'misiones') {
    if (!fecha) return null
    const partes = [etiquetaFecha(fecha, hoyISO)]
    if (hora) partes.push(formatearHora12(hora))
    return `Misión / ${partes.join(' / ')}`
  }

  const partes = [etiquetaFecha(fecha ?? hoyISO, hoyISO)]
  if (hora) partes[0] += ` · ${formatearHora12(hora)}`
  if (prioridad) partes.push(rotuloPrioridad(prioridad))
  return `Agenda / ${partes.join(' / ')}`
}

/** Sprint 014, punto 5: el aviso de confianza alta, enriquecido con lo que el parser reconoció. */
function mensajeAsignado(destino: IdeaDestino, texto: string): string {
  const base = DESTINO_ASIGNADO_MESSAGE[destino]
  if (destino !== 'agenda' && destino !== 'misiones') return `✓ ${base}`

  const { fecha, hora, prioridad } = interpretar(texto)
  const partes: string[] = []
  if (fecha) partes.push(etiquetaFecha(fecha))
  if (hora) partes.push(formatearHora12(hora))
  if (prioridad && destino === 'agenda') partes.push(rotuloPrioridad(prioridad))
  return partes.length > 0 ? `✓ ${base} · ${partes.join(' · ')}` : `✓ ${base}`
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
/** Cuánto queda a la vista el aviso de confianza alta antes de desvanecerse solo (Sprint 014, punto 5). */
const AVISO_ALTA_MS = 4000

export function IdeaCapture() {
  const { ideas, add, moveSheet, update } = useIdeas()
  const [value, setValue] = useState(() => readJSON(DRAFT_KEY, ''))
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  /**
   * Postic (E): cerrar el aviso solo apaga el aviso. Antes la única
   * forma de "cerrar" era la hoja densa (DeskPaperStack + IdeaSheet)
   * con su × de descarte, que archiva de verdad — así que el usuario
   * que solo quería silenciar el recordatorio terminaba, sin saberlo,
   * archivando el mismo contenido que Cuaderno muestra. Este set es
   * puro estado de sesión: nunca toca la Idea ni su destino, por eso
   * cerrarlo acá no afecta lo que se ve en Cuaderno.
   */
  const [avisoDescartados, setAvisoDescartados] = useState<Set<string>>(new Set())
  const proposalTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const altaDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Sprint 014, punto 3: confirmación silenciosa mientras se escribe. Para
   * Agenda/Misiones, en vez del mensaje genérico de una línea, arma
   * "Agenda / Viernes · 09:00 / Urgente" o "Misión / Mañana / 09:00" con
   * lo que el parser compartido ya reconoce — punto 4: sin fecha, no
   * inventa ninguna ("Banco" solo dice "Parece una misión.").
   */
  const preclasificacion = useMemo(() => {
    const texto = value.trim()
    if (!texto) return null
    const { destino, nivel } = comprehensionEngine.classify(texto)
    // Contrato §7: con confianza baja el Estudio no dice nada. Tampoco
    // mientras escribís.
    if (nivel === 'baja') return null

    if (destino === 'agenda' || destino === 'misiones') {
      const estructurada = vistaPreviaEstructurada(destino, texto)
      if (estructurada) return estructurada
    }
    return DESTINO_PREVIEW_MESSAGE[destino]
  }, [value])

  const hoyIdeas = ideas.filter((idea) => idea.destino === 'hoy')
  const propuesta = proposal ? ideas.find((idea) => idea.id === proposal.ideaId) : undefined
  const abierta = openedId ? hoyIdeas.find((idea) => idea.id === openedId) : undefined
  const activa = propuesta ?? abierta ?? hoyIdeas[0]

  useEffect(() => {
    return () => {
      if (proposalTimer.current) clearTimeout(proposalTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      if (altaDismissTimer.current) clearTimeout(altaDismissTimer.current)
    }
  }, [])

  function clearProposalState() {
    setProposal(null)
    if (proposalTimer.current) clearTimeout(proposalTimer.current)
    if (altaDismissTimer.current) clearTimeout(altaDismissTimer.current)
  }

  /**
   * Sprint 014, punto 1/2/6: una Misión es una Idea (destino='misiones'),
   * así que "escribí en cualquier lado, el Estudio decide" solo se
   * cumple si el Umbral también le pone `programadaFecha` — hasta ahora
   * solo lo hacía el "+ Nueva misión" propio de MisionesScreen. Agenda no
   * necesita esto: su Evento es una entidad aparte (ver
   * modules/agenda/AgendaScreen.tsx), que ya limpia su propio texto.
   */
  async function aplicarProgramacionSiMision(idea: Idea, destino: IdeaDestino, textoOriginal: string) {
    if (destino !== 'misiones') return
    const { fecha, hora, textoLimpio } = interpretar(textoOriginal)
    const patch: Partial<Omit<Idea, 'id' | 'createdAt'>> = {}
    if (textoLimpio && textoLimpio !== idea.texto) patch.texto = textoLimpio
    if (fecha) {
      patch.programadaFecha = fecha
      patch.programadaHora = hora
    }
    if (Object.keys(patch).length > 0) await update(idea.id, patch)
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

    // Umbral V1.3: 'hoy' es Cuaderno, y Cuaderno es donde la hoja ya
    // vive — no hay adónde "mudarla". Sin esta guarda, una corrección
    // aprendida hacia Cuaderno (ver memory.ts) llega con nivel 'alta' y
    // dispara moveSheet() igual que cualquier otro destino: un
    // auto-movimiento sin que el usuario lo haya pedido. El mismo
    // contrato que rige alta/media/baja para los otros seis destinos
    // acá resuelve en silencio, como la confianza baja.
    if (destino === 'hoy') return

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

      moveSheet(created, DESTINO_TO_FURNITURE[destino])
        .then(() => aplicarProgramacionSiMision(created, destino, texto))
        .catch((error) => {
          console.error('No se pudo mover la hoja al mueble propuesto', error)
        })
      recordClassification({
        texto,
        destinoPropuesto: destino,
        destinoElegido: null,
        reason,
        fecha: new Date().toISOString(),
      })

      // Sprint 014, punto 5: confianza alta se desvanece sola — a
      // diferencia de media, que espera indefinidamente (Contrato §7 no
      // cambia), acá ya es un hecho consumado, no una pregunta pendiente.
      altaDismissTimer.current = setTimeout(() => {
        setProposal((current) => (current?.ideaId === created.id ? null : current))
      }, AVISO_ALTA_MS)
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
    await aplicarProgramacionSiMision(idea, destino, proposal.texto)
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

  /**
   * Umbral V1.2 — la salida que faltaba. Con confianza baja el Estudio
   * no propone nada (Contrato §7), y hasta ahora eso dejaba la hoja sin
   * ninguna forma de moverse: los botones de destino solo existían
   * dentro de una propuesta. Una captura que el clasificador no
   * reconocía quedaba varada para siempre sobre el escritorio.
   *
   * El silencio del Estudio nunca puede convertirse en una jaula. Tocar
   * una hoja abre sus destinos, haya propuesta o no.
   */
  /**
   * Umbral V1.3 — la salida que faltaba junto a "¿Dónde vive?": no toda
   * hoja necesita un destino, algunas solo necesitan dejar de estar a
   * la vista. Contrato §8: nada se borra, así que descartar es mudar a
   * Archivo (silencioso, sin pasar por la propuesta ni por "¿Dónde
   * vive?") — la misma reversibilidad de siempre, nunca un borrado real.
   */
  async function handleDescartar(idea: Idea) {
    if (proposal?.ideaId === idea.id) clearProposalState()
    if (openedId === idea.id) setOpenedId(null)
    await moveSheet(idea, 'archivador')
  }

  async function handleMoverAbierta(furniture: FurnitureId) {
    const idea = ideas.find((i) => i.id === openedId)
    if (!idea) return
    const destino = FURNITURE_TO_DESTINO[furniture] ?? idea.destino
    await moveSheet(idea, furniture)
    await aplicarProgramacionSiMision(idea, destino, idea.texto)
    setOpenedId(null)
  }

  async function handleCorreccion(furniture: FurnitureId) {
    if (!proposal) return
    const idea = ideas.find((i) => i.id === proposal.ideaId)
    if (!idea) return

    const destino = FURNITURE_TO_DESTINO[furniture] ?? idea.destino
    await moveSheet(idea, furniture)
    await aplicarProgramacionSiMision(idea, destino, proposal.texto)
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
      {activa && (propuesta || abierta) ? (
        <DeskPaperStack ideas={hoyIdeas} activeId={activa.id} onOpen={setOpenedId}>
          <IdeaSheet
            idea={activa}
            open={Boolean(propuesta)}
            onDescartar={() => handleDescartar(activa)}
            onEliminar={() => handleDescartar(activa)}
          />
          {propuesta && proposal ? (
            <p className="idea-proposal">
              {proposal.nivel === 'alta'
                ? mensajeAsignado(proposal.destinoPropuesto, proposal.texto)
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
          {abierta && !proposal ? (
            <>
              <p className="idea-proposal">¿Dónde vive?</p>
              <div className="idea-destinos" role="group" aria-label="Elegir destino">
                {CORRECCION_DESTINOS.map((destino) => (
                  <button
                    key={destino.id}
                    type="button"
                    className="idea-destino"
                    onClick={() => handleMoverAbierta(destino.id)}
                  >
                    {destino.label}
                  </button>
                ))}
              </div>
            </>
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
      ) : activa && !avisoDescartados.has(activa.id) ? (
        <p className="idea-aviso">
          Hay una idea esperando un lugar.{' '}
          <button type="button" className="idea-aviso-link" onClick={() => setOpenedId(activa.id)}>
            Ver
          </button>
          {' · '}
          <button
            type="button"
            className="idea-aviso-cerrar"
            aria-label="Cerrar aviso"
            onClick={() => setAvisoDescartados((actual) => new Set(actual).add(activa.id))}
          >
            ×
          </button>
        </p>
      ) : null}
      <form
        onSubmit={handleSubmit}
        className={[
          'flex items-center gap-3 border-b pb-4 transition-[border-color] duration-150 ease-out focus-within:border-[#5a4430]/70 motion-reduce:transition-none',
          justSaved ? 'border-[#5a4430]/70' : 'border-border/60',
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
          className="captura-input min-w-0 flex-1 bg-transparent px-1 py-4 text-[16px] leading-relaxed text-ink caret-ink outline-none placeholder:text-ink-dim"
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
          {preclasificacion}
        </p>
      ) : null}
    </div>
  )
}

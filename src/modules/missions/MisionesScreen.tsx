import { useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { MUEBLES } from '@world/studio/muebles'
import { interpretarMision } from './extraccionFecha'
import { MAX_PRINCIPALES, seleccionarActivas, seleccionarPrincipales, seleccionarSecundarias } from './seleccionarPrincipales'
import { etiquetaFecha, formatearHora12 } from '@shared-kernel/text/interpretarTexto'
import type { Idea } from '@/types/idea'

/**
 * Misiones (Sprint 006 — "Sistema de ejecución"), reemplaza el Tablero
 * de Corcho de Sprint 2.3: misma pregunta ("¿qué tengo que hacer yo?"),
 * experiencia deliberadamente más chica.
 *
 * El brief pide una pantalla sin ruido y sin acumulación visual — lo
 * opuesto a un corcho con hojas rotadas y chinchetas (Sprint 2.3), así
 * que esa metáfora se retira de acá (`material-cork`/`tablero-hoja`/
 * `IdeaSheet` siguen existiendo para quien los use — Desk, Trading — no
 * se tocan). Se ordenan por más antigua primero (a diferencia del
 * Tablero, que ponía lo de hoy arriba) porque acá el punto es consumir
 * en cola.
 *
 * Sprint 016.2 ("Misiones: principales y secundarias") corrige dos
 * cosas que el diseño anterior hacía mal:
 *
 * 1. `seleccionarActivas` recortaba TODA la lista de pendientes a las
 *    cinco más antiguas antes de tocar el DOM — cualquier misión más
 *    allá de la quinta directamente no se renderizaba, ni siquiera
 *    oculta. Una misión pendiente nunca debe desaparecer solo porque
 *    existen más de cinco: el límite de cinco vive únicamente dentro
 *    de Principales (`MAX_PRINCIPALES`, ver seleccionarPrincipales.ts).
 * 2. "Principal" era "programada para hoy o mañana" — la fecha decidía
 *    sola. Ahora es una elección explícita del usuario
 *    (`Idea.misionPrincipal`), con su propio control en la fila
 *    ("Marcar como principal" / "Quitar de principales").
 *
 * Completar sigue sin dejar tachado ni gris (brief original,
 * "Experiencia"): la consecuencia es que no hay nada que
 * "des-completar" después, así que completar es directamente archivar
 * (moveSheet → archivador, Contrato del Umbral §8 — nada se borra) en
 * el mismo gesto. Completar una Principal libera su lugar sin
 * auto-reemplazo (punto 11 del Sprint 016.2): el usuario decide después
 * si promueve otra.
 *
 * El filtro `!== 'terminada'` es la única concesión al diseño anterior:
 * una misión ya marcada terminada bajo ese modelo (nunca archivada,
 * porque ese paso era opcional) no debe aparecer como pendiente.
 */
export function MisionesScreen() {
  const { ideas, ready, add, update, moveSheet } = useIdeas()
  const [draftTexto, setDraftTexto] = useState<string | null>(null)
  /** Sprint 016.2, punto 6: misión que el usuario intenta hacer Principal habiendo ya cinco — nunca se auto-decide. */
  const [intentoPrincipal, setIntentoPrincipal] = useState<Idea | null>(null)

  /** Sprint 014, punto 3: vista previa silenciosa mientras se escribe — nunca abre diálogos. */
  const previaDraft = useMemo(() => {
    if (!draftTexto?.trim()) return null
    const { fecha, hora } = interpretarMision(draftTexto)
    if (!fecha) return null
    return hora ? `${etiquetaFecha(fecha)} · ${formatearHora12(hora)}` : etiquetaFecha(fecha)
  }, [draftTexto])

  const activas = seleccionarActivas(ideas)
  const principales = seleccionarPrincipales(activas)
  const secundarias = seleccionarSecundarias(activas)

  function handleCompletar(mision: Idea) {
    if (intentoPrincipal?.id === mision.id) setIntentoPrincipal(null)
    void moveSheet(mision, 'archivador')
  }

  function handleTogglePrincipal(mision: Idea) {
    if (mision.misionPrincipal) {
      void update(mision.id, { misionPrincipal: false })
      return
    }
    if (principales.length >= MAX_PRINCIPALES) {
      setIntentoPrincipal(mision)
      return
    }
    void update(mision.id, { misionPrincipal: true })
  }

  function handleElegirReemplazo(actual: Idea) {
    if (!intentoPrincipal) return
    void update(actual.id, { misionPrincipal: false })
    void update(intentoPrincipal.id, { misionPrincipal: true })
    setIntentoPrincipal(null)
  }

  function handleTextoBlur(mision: Idea, event: React.FocusEvent<HTMLSpanElement>) {
    const texto = event.currentTarget.textContent?.trim() ?? ''
    if (texto && texto !== mision.texto) void update(mision.id, { texto })
    else if (!texto) event.currentTarget.textContent = mision.texto
  }

  function handleTextoKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  function handleNuevaMision() {
    setDraftTexto('')
  }

  async function handleDraftBlur() {
    const texto = (draftTexto ?? '').trim()
    setDraftTexto(null)
    if (!texto) return
    const { fecha, hora, textoLimpio } = interpretarMision(texto)
    const creada = await add(textoLimpio || texto, { destino: 'misiones', origen: 'misiones' })
    if (fecha) await update(creada.id, { programadaFecha: fecha, programadaHora: hora })
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  function renderFila(mision: Idea) {
    const esPrincipal = mision.misionPrincipal === true
    return (
      <li key={mision.id} className="mision-fila">
        <button type="button" className="mision-check" aria-label="Completar" onClick={() => handleCompletar(mision)}>
          <span className="mision-check-circulo" aria-hidden="true" />
        </button>
        <span className="mision-contenido">
          <span
            className="mision-texto"
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => handleTextoBlur(mision, event)}
            onKeyDown={handleTextoKeyDown}
          >
            {mision.texto}
          </span>
          {mision.programadaFecha && (
            <span className="mision-fecha">
              {etiquetaFecha(mision.programadaFecha)}
              {mision.programadaHora ? ` · ${formatearHora12(mision.programadaHora)}` : ''}
            </span>
          )}
        </span>
        <button
          type="button"
          className="mision-principal-toggle"
          aria-pressed={esPrincipal}
          aria-label={esPrincipal ? 'Quitar de principales' : 'Marcar como principal'}
          onClick={() => handleTogglePrincipal(mision)}
        >
          {esPrincipal ? '★' : '☆'}
        </button>
      </li>
    )
  }

  if (!ready) return null

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10" data-mueble={MUEBLES.misiones}>
      {activas.length === 0 ? (
        <EmptyState title="Nada que hacer todavía." description="Agregá lo primero que dependa solo de vos." />
      ) : (
        <>
          {principales.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="mision-grupo-titulo">Misiones principales</h2>
              <ul className="mision-lista">{principales.map(renderFila)}</ul>
              {intentoPrincipal && (
                <div className="flex flex-col gap-1">
                  <p className="mision-previa">
                    Ya tenés {MAX_PRINCIPALES} misiones principales. Elegí cuál sacar para que “{intentoPrincipal.texto}” ocupe su lugar.
                  </p>
                  <div className="idea-destinos" role="group" aria-label="Elegir cuál misión principal reemplazar">
                    {principales.map((p) => (
                      <button key={p.id} type="button" className="idea-destino" onClick={() => handleElegirReemplazo(p)}>
                        Sacar “{p.texto}”
                      </button>
                    ))}
                    <button type="button" className="idea-destino" onClick={() => setIntentoPrincipal(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {secundarias.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="mision-grupo-titulo">Misiones secundarias</h2>
              <ul className="mision-lista">{secundarias.map(renderFila)}</ul>
            </div>
          )}
        </>
      )}

      {draftTexto !== null ? (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            autoFocus
            value={draftTexto}
            onChange={(event) => setDraftTexto(event.target.value)}
            onBlur={handleDraftBlur}
            onKeyDown={handleDraftKeyDown}
            placeholder="¿Qué tenés que hacer?"
            className="mision-nuevo-input"
          />
          {previaDraft && <span className="mision-previa">{previaDraft}</span>}
        </div>
      ) : (
        <button type="button" className="mision-nuevo-boton" onClick={handleNuevaMision}>
          + Nueva misión
        </button>
      )}
    </div>
  )
}

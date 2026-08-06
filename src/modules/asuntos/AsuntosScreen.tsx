import { useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  ASUNTO_ESTADOS,
  ESTADO_LABEL,
  PRIORIDAD_LABEL,
  estadoDe,
  prioridadDe,
  type AsuntoEstado,
} from './estados'
import type { Idea } from '@/types/idea'

/** Pendiente y en espera son lo que sigue abierto; resuelto/archivado cierran abajo, en voz baja. */
const ABIERTOS: readonly AsuntoEstado[] = ['pendiente', 'en-espera']
const CERRADOS: readonly AsuntoEstado[] = ['resuelto', 'archivado']

/**
 * Asuntos (Sprint 005 — "Sistema de seguimiento"), reemplaza la versión
 * de Sprint de Producto 003: misma pregunta ("¿qué sigue abierto y
 * requiere seguimiento?"), arquitectura de información distinta.
 *
 * Un asunto ya no es una sola línea de texto con un reloj al lado — son
 * cuatro datos, ni uno más: qué se espera, de quién o qué se espera,
 * estado, prioridad. La pantalla se organiza sola por estado (nunca
 * pestañas/filtros/vistas): lo abierto (Pendiente, En espera) arriba,
 * lo cerrado (Resuelto, Archivado) abajo y en voz baja — el mismo
 * patrón "lo activo pesa, lo cerrado no" que ya usan Cuaderno y
 * Hábitos.
 *
 * "Archivado" es ahora un estado del propio asunto, no un traslado de
 * mueble (a diferencia de Hábitos/Cuaderno, que archivan con
 * moveSheet): acá archivar y resolver son la misma clase de operación
 * — cambiar de estado —, así que comparten el mismo selector en vez de
 * tener un botón "×" aparte.
 *
 * Filosofía (brief): un asunto nunca se convierte en misión. Cuando
 * deja de depender de afuera se resuelve, y la misión nueva (si hace
 * falta) se crea a mano en Misiones — los módulos quedan
 * independientes, así que esta pantalla no ofrece ningún botón
 * "convertir".
 *
 * No importa `@world` (dependency-cruiser `module-no-world`): las
 * excepciones son código anterior a F16 y un módulo nuevo no las hereda.
 */
export function AsuntosScreen() {
  const { ideas, ready, add, update } = useIdeas()
  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const [draftTexto, setDraftTexto] = useState<string | null>(null)

  const asuntos = ideas.filter((idea) => idea.destino === 'asuntos')
  const porEstado = (estado: AsuntoEstado) => asuntos.filter((asunto) => estadoDe(asunto) === estado)
  const hayAbiertos = ABIERTOS.some((estado) => porEstado(estado).length > 0)

  function cambiarEstado(asunto: Idea, estado: AsuntoEstado) {
    void update(asunto.id, { estado })
    setAbiertoId(null)
  }

  function cambiarPrioridad(asunto: Idea) {
    const siguiente = prioridadDe(asunto) === 'importante' ? 'normal' : 'importante'
    void update(asunto.id, { prioridad: siguiente })
  }

  function handleQueBlur(asunto: Idea, event: React.FocusEvent<HTMLSpanElement>) {
    const texto = event.currentTarget.textContent?.trim() ?? ''
    if (texto && texto !== asunto.texto) void update(asunto.id, { texto })
    else if (!texto) event.currentTarget.textContent = asunto.texto
  }

  function handleContraparteBlur(asunto: Idea, event: React.FocusEvent<HTMLSpanElement>) {
    const contraparte = event.currentTarget.textContent?.trim() ?? ''
    if (contraparte !== (asunto.contraparte ?? '')) void update(asunto.id, { contraparte })
  }

  function handleEditKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  function handleNuevoAsunto() {
    setDraftTexto('')
  }

  async function handleDraftBlur() {
    const texto = (draftTexto ?? '').trim()
    setDraftTexto(null)
    if (!texto) return
    await add(texto, { destino: 'asuntos', origen: 'asuntos' })
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  if (!ready) return null

  function renderAsunto(asunto: Idea) {
    const estado = estadoDe(asunto)
    const prioridad = prioridadDe(asunto)
    const abierto = abiertoId === asunto.id
    const cerrado = estado === 'resuelto' || estado === 'archivado'

    return (
      <li key={asunto.id} className="border-b border-border/40 py-3.5 last:border-b-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span
              className={['asunto-que', cerrado ? 'asunto-que-cerrado' : ''].join(' ').trim()}
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => handleQueBlur(asunto, event)}
              onKeyDown={handleEditKeyDown}
            >
              {asunto.texto}
            </span>
            <span
              className="asunto-contraparte"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="¿De quién o qué se espera?"
              onBlur={(event) => handleContraparteBlur(asunto, event)}
              onKeyDown={handleEditKeyDown}
            >
              {asunto.contraparte ?? ''}
            </span>
          </div>
          <button
            type="button"
            className={['asunto-prioridad', prioridad === 'importante' ? 'asunto-prioridad-importante' : '']
              .join(' ')
              .trim()}
            onClick={() => cambiarPrioridad(asunto)}
          >
            {PRIORIDAD_LABEL[prioridad]}
          </button>
        </div>
        <button
          type="button"
          className="asunto-estado-boton"
          onClick={() => setAbiertoId(abierto ? null : asunto.id)}
          aria-expanded={abierto}
        >
          {ESTADO_LABEL[estado]}
        </button>
        {abierto ? (
          <div className="idea-destinos pb-1" role="group" aria-label="Cambiar estado">
            {ASUNTO_ESTADOS.filter((siguiente) => siguiente !== estado).map((siguiente) => (
              <button
                key={siguiente}
                type="button"
                className="idea-destino"
                onClick={() => cambiarEstado(asunto, siguiente)}
              >
                {ESTADO_LABEL[siguiente]}
              </button>
            ))}
          </div>
        ) : null}
      </li>
    )
  }

  function renderNuevo() {
    return draftTexto !== null ? (
      <input
        type="text"
        autoFocus
        value={draftTexto}
        onChange={(event) => setDraftTexto(event.target.value)}
        onBlur={handleDraftBlur}
        onKeyDown={handleDraftKeyDown}
        placeholder="¿Qué estás esperando?"
        className="asunto-nuevo-input"
      />
    ) : (
      <button type="button" className="asunto-nuevo-boton" onClick={handleNuevoAsunto}>
        + Nuevo asunto
      </button>
    )
  }

  if (asuntos.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
        <EmptyState
          title="Nada esperando a nadie."
          description="Escribí algo que dependa de otra persona — “esperando la factura de César” — y el Estudio lo va a traer acá."
        />
        {renderNuevo()}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      {ABIERTOS.map((estado) => {
        const delEstado = porEstado(estado)
        if (delEstado.length === 0) return null
        return (
          <section key={estado}>
            <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">{ESTADO_LABEL[estado]}</h2>
            <ul className="flex flex-col">{delEstado.map(renderAsunto)}</ul>
          </section>
        )
      })}

      {!hayAbiertos ? (
        <EmptyState title="Nada abierto." description="Todo lo que dependía de alguien más está resuelto." />
      ) : null}

      {renderNuevo()}

      {CERRADOS.map((estado) => {
        const delEstado = porEstado(estado)
        if (delEstado.length === 0) return null
        return (
          <section key={estado}>
            <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">{ESTADO_LABEL[estado]}</h2>
            <ul className="flex flex-col">{delEstado.map(renderAsunto)}</ul>
          </section>
        )
      })}
    </div>
  )
}

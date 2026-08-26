import { useState } from 'react'
import { PRIORIDAD_LABEL, prioridadDe, type AsuntoPrioridad } from './estados'
import type { Idea } from '@/types/idea'

export interface PatchAsunto {
  texto: string
  contraparte: string
  prioridad: AsuntoPrioridad
}

interface AsuntoRowProps {
  asunto: Idea
  cerrado: boolean
  onEditar: (patch: PatchAsunto) => void
  /** Ausente para un asunto que ya está resuelto/archivado — resolver algo que ya cerró no tiene sentido. */
  onResolver?: (() => void) | undefined
  onEliminar: () => void
}

/**
 * Sprint "Redefinir y reconstruir UX de Asuntos" — mismo patrón de
 * tap-to-reveal que ya usa Finanzas (`MovimientoRow.tsx`): Editar,
 * Resolver y Eliminar nunca están permanentemente visibles, tocar la
 * fila los revela. Antes esta fila tenía dos campos siempre editables
 * (contentEditable) más un selector de estado siempre visible — el
 * brief pide exactamente lo contrario: pantalla limpia, acciones ocultas
 * hasta que se piden.
 */
export function AsuntoRow({ asunto, cerrado, onEditar, onResolver, onEliminar }: AsuntoRowProps) {
  const [interactuando, setInteractuando] = useState(false)
  const [formAbierto, setFormAbierto] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [tituloTexto, setTituloTexto] = useState(asunto.texto)
  const [pendienteTexto, setPendienteTexto] = useState(asunto.contraparte ?? '')
  const [prioridadEditada, setPrioridadEditada] = useState<AsuntoPrioridad>(() => prioridadDe(asunto))

  const prioridad = prioridadDe(asunto)

  function alternarInteraccion() {
    setInteractuando((actual) => {
      if (actual) {
        setFormAbierto(false)
        setConfirmandoBorrado(false)
      }
      return !actual
    })
  }

  function abrirForm() {
    setTituloTexto(asunto.texto)
    setPendienteTexto(asunto.contraparte ?? '')
    setPrioridadEditada(prioridadDe(asunto))
    setFormAbierto(true)
  }

  function guardarEdicion() {
    const texto = tituloTexto.trim()
    if (!texto) return
    onEditar({ texto, contraparte: pendienteTexto.trim(), prioridad: prioridadEditada })
    setFormAbierto(false)
    setInteractuando(false)
  }

  return (
    <li className="border-b border-border/40 py-3.5 last:border-b-0">
      <button
        type="button"
        className="flex w-full appearance-none flex-col items-start gap-1 border-0 bg-transparent p-0 text-left"
        onClick={alternarInteraccion}
        aria-expanded={interactuando}
      >
        <span className={['asunto-que', cerrado ? 'asunto-que-cerrado' : ''].join(' ').trim()}>{asunto.texto}</span>
        <span className="asunto-contraparte">Pendiente: {asunto.contraparte?.trim() ? asunto.contraparte : '—'}</span>
        {prioridad === 'importante' ? (
          <span className="asunto-prioridad asunto-prioridad-importante">{PRIORIDAD_LABEL.importante}</span>
        ) : null}
      </button>

      {interactuando ? (
        <div className="mt-1.5 flex flex-wrap gap-3">
          <button type="button" className="idea-destino" onClick={() => (formAbierto ? setFormAbierto(false) : abrirForm())}>
            {formAbierto ? 'Cancelar' : 'Editar'}
          </button>
          {onResolver ? (
            <button type="button" className="idea-destino" onClick={onResolver}>
              Resolver
            </button>
          ) : null}
          <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado((actual) => !actual)}>
            Eliminar
          </button>
        </div>
      ) : null}

      {formAbierto ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            value={tituloTexto}
            onChange={(event) => setTituloTexto(event.target.value)}
            aria-label="Título"
            placeholder="Título"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-dim"
          />
          <input
            type="text"
            value={pendienteTexto}
            onChange={(event) => setPendienteTexto(event.target.value)}
            aria-label="Pendiente"
            placeholder="¿Qué hay que hacer o recordar?"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[13.5px] text-ink outline-none placeholder:text-ink-dim"
          />
          <button
            type="button"
            className={['asunto-prioridad self-start', prioridadEditada === 'importante' ? 'asunto-prioridad-importante' : '']
              .join(' ')
              .trim()}
            onClick={() => setPrioridadEditada((actual) => (actual === 'importante' ? 'normal' : 'importante'))}
          >
            {PRIORIDAD_LABEL[prioridadEditada]}
          </button>
          <button
            type="button"
            className="idea-destino self-start disabled:opacity-40"
            disabled={!tituloTexto.trim()}
            onClick={guardarEdicion}
          >
            Guardar
          </button>
        </div>
      ) : null}

      {confirmandoBorrado ? (
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[13px] text-ink-faint">¿Eliminar este asunto?</span>
          <button
            type="button"
            className="idea-destino"
            style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}
            onClick={() => {
              onEliminar()
              setConfirmandoBorrado(false)
            }}
          >
            Sí, eliminar
          </button>
          <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado(false)}>
            No
          </button>
        </div>
      ) : null}
    </li>
  )
}

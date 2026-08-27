import { useState } from 'react'
import { generateId } from '@shared-kernel/id'
import type { Idea, Subtarea } from '@/types/idea'

/**
 * Detalle de una misión (rediseño Misiones): checklist de sub-tareas.
 * Progreso y "X de Y" son siempre derivados de `mision.subtareas` — nunca
 * un valor editable a mano, para que nunca exista un segundo sistema de
 * progreso desincronizado del real.
 *
 * Reusa las clases/mecanismos existentes de la fila de Misiones
 * (.mision-fila, .mision-check-circulo, .mision-texto, .mision-nuevo-*)
 * en vez de inventar un lenguaje visual nuevo para el detalle.
 */
export function MisionDetalle({
  mision,
  onCerrar,
  onActualizarSubtareas,
}: {
  mision: Idea
  onCerrar: () => void
  onActualizarSubtareas: (subtareas: Subtarea[]) => void
}) {
  const [draftTexto, setDraftTexto] = useState<string | null>(null)
  const subtareas = mision.subtareas ?? []
  const total = subtareas.length
  const hechas = subtareas.filter((subtarea) => subtarea.completada).length
  const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 0

  function toggleSubtarea(id: string) {
    onActualizarSubtareas(
      subtareas.map((subtarea) => (subtarea.id === id ? { ...subtarea, completada: !subtarea.completada } : subtarea)),
    )
  }

  function agregarSubtarea() {
    const texto = (draftTexto ?? '').trim()
    setDraftTexto(null)
    if (!texto) return
    onActualizarSubtareas([...subtareas, { id: generateId(), texto, completada: false }])
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="idea-destino self-start" onClick={onCerrar}>
        ‹ Misiones
      </button>

      <div className="mision-detalle-cabecera">
        <p className="mision-detalle-titulo">{mision.texto}</p>
        {total > 0 && (
          <>
            <p className="mision-detalle-contador">
              {hechas} de {total} sub-tareas
            </p>
            <div className="mision-detalle-barra">
              <div className="mision-detalle-barra-relleno" style={{ width: `${porcentaje}%` }} />
            </div>
          </>
        )}
      </div>

      {total > 0 && (
        <ul className="mision-lista">
          {subtareas.map((subtarea) => (
            <li key={subtarea.id} className="mision-fila">
              <button
                type="button"
                className="mision-check"
                aria-label={subtarea.completada ? 'Marcar sub-tarea como pendiente' : 'Marcar sub-tarea como completada'}
                aria-pressed={subtarea.completada}
                onClick={() => toggleSubtarea(subtarea.id)}
              >
                <span
                  className="mision-check-circulo"
                  aria-hidden="true"
                  style={subtarea.completada ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                />
              </button>
              <span className="mision-contenido" style={{ cursor: 'default' }}>
                <span className="mision-texto" style={{ cursor: 'default' }}>
                  {subtarea.texto}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {draftTexto !== null ? (
        <input
          type="text"
          autoFocus
          value={draftTexto}
          onChange={(event) => setDraftTexto(event.target.value)}
          onBlur={agregarSubtarea}
          onKeyDown={handleDraftKeyDown}
          placeholder="¿Qué sub-tarea falta?"
          className="mision-nuevo-input"
        />
      ) : (
        <button type="button" className="mision-nuevo-boton" onClick={() => setDraftTexto('')}>
          + Agregar sub-tarea…
        </button>
      )}
    </div>
  )
}

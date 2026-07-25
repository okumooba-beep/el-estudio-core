import { useEffect, useRef } from 'react'
import type { Idea } from '@/types/idea'

interface IdeaSheetProps {
  idea: Idea
  /** El giro mínimo que recibe cuando el Escritorio le muestra una propuesta (ver .idea-hoja-open). */
  open?: boolean
  /** Sprint 3.0: la misma hoja, ahora puede aceptar edición directa sobre su propio texto. */
  editable?: boolean
  onTextoChange?: (texto: string) => void
  /** Sprint 3.2, prioridad 1: una hoja nueva que queda vacía al salir no se guarda. */
  onEmptyBlur?: () => void
  /** Sprint 3.2, prioridad 6: una misión terminada queda visiblemente distinta, nunca desaparece de golpe. */
  completed?: boolean
}

/**
 * La hoja: el único diseño para una Idea, viva en cualquier mueble
 * (Sprint 2.3, punto 05 — "la hoja es la misma"). El Escritorio
 * (DeskPaperStack) y el Tablero de Corcho (MisionesScreen) la usan sin
 * cambiarle una línea. Lo que cambia es siempre lo que la rodea — una
 * pila, una chincheta — nunca la hoja en sí.
 */
export function IdeaSheet({ idea, open, editable, onTextoChange, onEmptyBlur, completed }: IdeaSheetProps) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!editable || !spanRef.current) return
    const span = spanRef.current
    span.focus()
    const range = document.createRange()
    range.selectNodeContents(span)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    if (selection) selection.addRange(range)
  }, [editable])

  function handleBlur(event: React.FocusEvent<HTMLSpanElement>) {
    if (!editable) return
    const texto = event.currentTarget.textContent?.trim() ?? ''
    if (texto) {
      if (texto !== idea.texto) onTextoChange?.(texto)
    } else {
      onEmptyBlur?.()
    }
  }

  return (
    <p
      className={`idea-hoja material-paper${open ? ' idea-hoja-open' : ''}${completed ? ' idea-hoja-completed' : ''}`}
    >
      {completed ? (
        <span className="idea-hoja-check" aria-hidden="true">
          ✓
        </span>
      ) : null}
      <span
        ref={spanRef}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        onBlur={handleBlur}
      >
        {idea.texto}
      </span>
      <span className="idea-hoja-time">{idea.hora}</span>
    </p>
  )
}

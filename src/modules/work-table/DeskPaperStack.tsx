import type { ReactNode } from 'react'
import type { Idea } from '@/types/idea'

interface DeskPaperStackProps {
  /** Ideas que hoy siguen sin hogar (destino 'hoy'), más reciente primero. */
  ideas: readonly Idea[]
  /**
   * La hoja que se muestra completa, arriba de la pila. Puede ya no
   * estar en `ideas` si el Estudio ya le asignó otro mueble y la
   * propuesta todavía la sostiene un momento arriba (ver punto 04:
   * el cambio de mueble es lógico antes que visual).
   */
  activeId?: string
  /** Sprint 3.0: traer al frente una hoja de más atrás mientras sigue viviendo en el Escritorio. */
  onOpen?: (id: string) => void
  children: ReactNode
}

const MAX_BACK_SHEETS = 2

/**
 * El Escritorio no es una pantalla, es un mueble (Sprint 2.2) — y un
 * escritorio real no lista sus papeles, los apila. Esto cierra el
 * hallazgo de la auditoría del Sprint 2.1: antes `ideas.find(...)`
 * mostraba una sola Idea y las anteriores parecían perdidas (seguían en
 * IndexedDB, pero no ocupaban ningún lugar visual). Ahora hasta 2 Ideas
 * más viejas siguen existiendo detrás de la activa, cada una dejando
 * ver apenas su borde — nunca una fila, nunca un contador, nunca scroll.
 * Sprint 3.6 (revisión): la pila entera nunca muestra más de 3 hojas a
 * la vez (2 detrás + la activa) — las que no entran (más de 3 en total)
 * siguen vivas en IndexedDB exactamente igual: simplemente no ocupan
 * espacio acá.
 */
export function DeskPaperStack({ ideas, activeId, onOpen, children }: DeskPaperStackProps) {
  const detras = ideas.filter((idea) => idea.id !== activeId).slice(0, MAX_BACK_SHEETS)

  return (
    <div className="desk-paper-stack">
      {detras.map((idea, index) => (
        <button
          key={idea.id}
          type="button"
          aria-label="Abrir esta hoja"
          onClick={() => onOpen?.(idea.id)}
          className="desk-paper-sheet material-paper"
          style={{ '--stack-i': index + 1 } as React.CSSProperties}
        />
      ))}
      <div className="desk-paper-sheet-active">{children}</div>
    </div>
  )
}

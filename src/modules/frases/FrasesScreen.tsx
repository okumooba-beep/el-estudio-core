import { useState } from 'react'
import { useIdeas, IdeaSheet, draftIdea } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Idea } from '@/types/idea'

/**
 * Biblioteca de frases — antes un ModulePlaceholder ("se construye
 * cuando tenga evidencia detrás"). Deja de ser una promesa a futuro:
 * una frase se agrega acá directamente, sin depender de que el Umbral
 * la haya clasificado antes.
 */
export function FrasesScreen() {
  const { ideas, ready, add, update, remove } = useIdeas()
  const [draft, setDraft] = useState<Idea | null>(null)
  const frases = ideas.filter((idea) => idea.destino === 'biblioteca')

  function handleNuevaFrase() {
    setDraft(draftIdea('biblioteca'))
  }

  async function handleDraftCommit(texto: string) {
    await add(texto, { destino: 'biblioteca', origen: 'biblioteca' })
    setDraft(null)
  }

  function handleDraftDiscard() {
    setDraft(null)
  }

  function handleEditar(frase: Idea, texto: string) {
    void update(frase.id, { texto })
  }

  function handleEliminar(frase: Idea) {
    void remove(frase.id)
  }

  if (!ready) return null

  return (
    <div className="flex flex-col gap-5 pt-2">
      <button
        type="button"
        onClick={handleNuevaFrase}
        className="self-start text-[13.5px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
      >
        Agregar frase
      </button>
      {frases.length === 0 && !draft ? (
        <EmptyState
          title="Ninguna frase todavía."
          description="Agregala vos o escribí algo en el Umbral y elegí Biblioteca."
        />
      ) : (
        <ul className="frase-lista">
          {draft ? (
            <li>
              <IdeaSheet
                idea={draft}
                open
                editable
                onTextoChange={handleDraftCommit}
                onEmptyBlur={handleDraftDiscard}
              />
            </li>
          ) : null}
          {frases.map((frase) => (
            <FraseRow
              key={frase.id}
              frase={frase}
              onEditar={(texto) => handleEditar(frase, texto)}
              onEliminar={() => handleEliminar(frase)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface FraseRowProps {
  frase: Idea
  onEditar: (texto: string) => void
  onEliminar: () => void
}

/**
 * Sprint "Editar/Eliminar frases" — mismo patrón de tap-to-reveal que ya
 * usa Asuntos (`AsuntoRow.tsx`, a su vez heredado de Finanzas): las
 * acciones nunca están permanentemente visibles, tocar la frase las
 * revela. La confirmación de borrado sigue el mismo criterio visual
 * inline (texto + Eliminar/Cancelar) que ya usa Asuntos, sin depender de
 * ese módulo — construida acá con la misma clase compartida `.idea-destino`.
 */
function FraseRow({ frase, onEditar, onEliminar }: FraseRowProps) {
  const [interactuando, setInteractuando] = useState(false)
  const [formAbierto, setFormAbierto] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [texto, setTexto] = useState(frase.texto)

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
    setTexto(frase.texto)
    setFormAbierto(true)
  }

  function guardarEdicion() {
    const nuevo = texto.trim()
    if (!nuevo) return
    onEditar(nuevo)
    setFormAbierto(false)
    setInteractuando(false)
  }

  return (
    <li className="frase-registro">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <button
          type="button"
          className="w-full appearance-none border-0 bg-transparent p-0 text-left"
          onClick={alternarInteraccion}
          aria-expanded={interactuando}
        >
          <span className="frase-texto">{frase.texto}</span>
        </button>

        {interactuando ? (
          <div className="flex flex-wrap gap-3">
            <button type="button" className="idea-destino" onClick={() => (formAbierto ? setFormAbierto(false) : abrirForm())}>
              {formAbierto ? 'Cancelar' : 'Editar'}
            </button>
            <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado((actual) => !actual)}>
              Eliminar
            </button>
          </div>
        ) : null}

        {formAbierto ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              aria-label="Frase"
              rows={3}
              className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-dim"
            />
            <button
              type="button"
              className="idea-destino self-start disabled:opacity-40"
              disabled={!texto.trim()}
              onClick={guardarEdicion}
            >
              Guardar
            </button>
          </div>
        ) : null}

        {confirmandoBorrado ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-ink-faint">¿Eliminar frase?</span>
            <button
              type="button"
              className="idea-destino"
              style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}
              onClick={() => {
                onEliminar()
                setConfirmandoBorrado(false)
              }}
            >
              Eliminar
            </button>
            <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado(false)}>
              Cancelar
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )
}

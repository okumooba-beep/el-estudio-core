import { useState } from 'react'
import { useIdeas, IdeaSheet, draftIdea } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Idea } from '@/types/idea'

/**
 * Biblioteca de frases — antes un ModulePlaceholder ("se construye
 * cuando tenga evidencia detrás"). Deja de ser una promesa a futuro:
 * una frase se agrega acá directamente, sin depender de que el Umbral
 * la haya clasificado antes. A diferencia de Hábitos, una frase
 * guardada no se reabre para editar — es memoria, no un registro que
 * cambia: "sin acción, solo consulta." Quitar una es el mismo acuerdo
 * de siempre (Contrato §8): se archiva, nunca se borra de verdad.
 */
export function FrasesScreen() {
  const { ideas, ready, add, moveSheet } = useIdeas()
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

  function handleArchivar(frase: Idea) {
    void moveSheet(frase, 'archivador')
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
            <li key={frase.id} className="frase-registro">
              <p className="frase-texto">{frase.texto}</p>
              <button
                type="button"
                className="frase-archivar"
                aria-label="Archivar"
                onClick={() => handleArchivar(frase)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

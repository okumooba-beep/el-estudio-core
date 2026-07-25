import { useState } from 'react'
import { useIdeas, IdeaSheet, draftIdea, DRAFT_ID } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { describeDay } from '@shared-kernel/date/describeDay'
import { MUEBLES } from '@world/studio/muebles'
import { getSheetPlacement } from '@world/studio/sheetPhysics'
import type { Idea } from '@/types/idea'

const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', terminada: 'Terminada' }

/**
 * El Tablero de Corcho (Sprint 2.3 — "El Primer Mueble"): una misión no
 * es un dato en una lista, es un papel esperando una acción — por eso
 * nunca vuelve a aparecer como fila. Cada una es literalmente
 * <IdeaSheet>, la misma hoja que usa el Escritorio (punto 05, "la hoja
 * es la misma"): ningún componente nuevo, ningún diseño nuevo. Lo único
 * que cambia es el mueble alrededor — corcho en vez del fondo de la
 * habitación, una chincheta en vez de una pila.
 *
 * El orden es el mismo que ya trae `ideas` (más reciente primero, ver
 * useIdeas): arriba lo que se pensó hoy, abajo lo que lleva más tiempo
 * esperando (punto 04, "arriba lo importante, abajo lo pendiente") —
 * sin agregar ningún campo de prioridad, sin colores, sin badges.
 *
 * Habitable (Sprint 3.0): tocar una hoja la abre — deja de ser texto
 * fijo y acepta edición directa (misma hoja, ver IdeaSheet), y aparece
 * la única acción que le falta a una misión real: marcarla terminada.
 * Nunca un modal, nunca un checklist — la misma voz baja que ya usa
 * la corrección de destino en el Escritorio (.idea-destinos).
 */
export function MisionesScreen() {
  const { ideas, ready, add, update, moveSheet } = useIdeas()
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Idea | null>(null)
  const misiones = ideas.filter((idea) => idea.destino === 'misiones')

  function handleNuevaHoja() {
    setDraft(draftIdea('misiones'))
    setOpenId(DRAFT_ID)
  }

  async function handleDraftCommit(texto: string) {
    const created = await add(texto, { destino: 'misiones', origen: 'misiones' })
    setDraft(null)
    setOpenId(created.id)
  }

  function handleDraftDiscard() {
    setDraft(null)
    setOpenId(null)
  }

  function handleTerminada(mision: Idea) {
    void update(mision.id, { estado: mision.estado === 'terminada' ? 'pendiente' : 'terminada' })
  }

  function handleArchivar(mision: Idea) {
    void moveSheet(mision, 'archivador')
    if (openId === mision.id) setOpenId(null)
  }

  const hoy = new Date().toISOString().slice(0, 10)
  const pendientes = misiones.filter((m) => m.estado !== 'terminada').length
  const completadasHoy = misiones.filter((m) => m.estado === 'terminada' && m.fecha === hoy).length

  return (
    <div className="material-cork tablero" data-mueble={MUEBLES.misiones}>
      <div className="mb-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleNuevaHoja}
          className="self-start text-[13.5px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
        >
          Nueva hoja
        </button>
        {misiones.length > 0 ? (
          <p className="text-[12px] text-ink-faint">
            Hoy · {pendientes} pendiente{pendientes === 1 ? '' : 's'} · {completadasHoy} completada
            {completadasHoy === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>
      {!ready ? null : misiones.length === 0 && !draft ? (
        <EmptyState
          title="Ninguna idea vive acá todavía."
          description="Tocá 'Nueva hoja' o guardá una idea y elegí Misiones."
        />
      ) : (
        <ul className="tablero-hojas">
        {draft ? (
          <li
            className="tablero-hoja-wrap"
            style={
              {
                '--rotation': '0deg',
                '--chincheta-x': '1.1rem',
                zIndex: misiones.length + 1,
              } as React.CSSProperties
            }
          >
            <span className="chincheta material-metal" aria-hidden="true" />
            <IdeaSheet
              idea={draft}
              open
              editable
              onTextoChange={handleDraftCommit}
              onEmptyBlur={handleDraftDiscard}
            />
          </li>
        ) : null}
        {misiones.map((mision, index) => {
          const placement = getSheetPlacement(index)
          return (
            <li
              key={mision.id}
              className="tablero-hoja-wrap"
              style={
                {
                  '--rotation': `${placement.rotation}deg`,
                  '--offset-x': `${placement.position?.x ?? 0}px`,
                  '--offset-y': `${placement.position?.y ?? 0}px`,
                  '--chincheta-x': `${1.1 + (placement.position?.x ?? 0) / 32}rem`,
                  zIndex: placement.depth,
                } as React.CSSProperties
              }
              onClick={() => setOpenId(mision.id)}
            >
              <span className="chincheta material-metal" aria-hidden="true" />
              <IdeaSheet
                idea={mision}
                open={openId === mision.id}
                editable={openId === mision.id}
                completed={mision.estado === 'terminada'}
                onTextoChange={(texto) => update(mision.id, { texto })}
              />
              <p className="tablero-hoja-meta">
                Creada {describeDay(mision.fecha)}
                {mision.estado ? ` · ${ESTADO_LABEL[mision.estado] ?? mision.estado}` : ''}
              </p>
              {openId === mision.id ? (
                <div className="idea-destinos" role="group" aria-label="Acciones">
                  <button
                    type="button"
                    className="idea-destino"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleTerminada(mision)
                    }}
                  >
                    {mision.estado === 'terminada' ? 'Marcar pendiente' : 'Marcar terminada'}
                  </button>
                  {mision.estado === 'terminada' ? (
                    <button
                      type="button"
                      className="idea-destino"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleArchivar(mision)
                      }}
                    >
                      Archivar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
        </ul>
      )}
    </div>
  )
}

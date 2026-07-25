import { useState } from 'react'
import { useIdeas, IdeaSheet, draftIdea, DRAFT_ID } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useHabitChecks } from './useHabitChecks'
import { MUEBLES } from '@world/studio/muebles'
import type { Idea } from '@/types/idea'

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function fechasSemanaActual(): string[] {
  const hoy = new Date()
  const offsetLunes = hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoy)
    dia.setDate(hoy.getDate() + offsetLunes + i)
    return dia.toISOString().slice(0, 10)
  })
}

/**
 * Sprint 3.6 — "Los muebles dejan de parecer pantallas": Hábitos ya no
 * lista hojas, se ve como lo que es — un registro semanal de círculos
 * (Sprint 2.0, punto 04: el sistema de seguimiento llega recién acá).
 * El nombre del hábito sigue siendo la misma <IdeaSheet> de siempre
 * (nada nuevo que crear ni que borrar); lo único nuevo es la fila de
 * círculos debajo, con su propia tabla mínima (ver habitCheckRepository).
 */
export function HabitosScreen() {
  const { ideas, ready, add, update } = useIdeas()
  const { checks, ready: checksReady, toggle } = useHabitChecks()
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Idea | null>(null)
  const habitos = ideas.filter((idea) => idea.destino === 'habitos')
  const semana = fechasSemanaActual()
  const hoyISO = new Date().toISOString().slice(0, 10)

  function handleNuevaHoja() {
    setDraft(draftIdea('habitos'))
    setOpenId(DRAFT_ID)
  }

  async function handleDraftCommit(texto: string) {
    const created = await add(texto, { destino: 'habitos', origen: 'habitos' })
    setDraft(null)
    setOpenId(created.id)
  }

  function handleDraftDiscard() {
    setDraft(null)
    setOpenId(null)
  }

  return (
    <div className="flex flex-col gap-5 pt-2" data-mueble={MUEBLES.habitos}>
      <button
        type="button"
        onClick={handleNuevaHoja}
        className="self-start text-[13.5px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
      >
        Nueva hoja
      </button>
      {!ready || !checksReady ? null : habitos.length === 0 && !draft ? (
        <EmptyState
          title="Ningún hábito existe todavía."
          description="Tocá 'Nueva hoja' o guardá una idea y elegí Hábitos."
        />
      ) : (
        <ul className="habito-lista">
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
          {habitos.map((habito) => (
            <li key={habito.id} className="habito-registro">
              <div onClick={() => setOpenId(habito.id)}>
                <IdeaSheet
                  idea={habito}
                  open={openId === habito.id}
                  editable={openId === habito.id}
                  onTextoChange={(texto) => update(habito.id, { texto })}
                />
              </div>
              <div className="habito-semana">
                {semana.map((fecha, i) => {
                  const checked = checks.some((c) => c.habitId === habito.id && c.fecha === fecha && c.checked)
                  const esHoy = fecha === hoyISO
                  return (
                    <button
                      key={fecha}
                      type="button"
                      className={`habito-dia${checked ? ' habito-dia-marcado' : ''}${esHoy ? ' habito-dia-hoy' : ''}`}
                      onClick={() => toggle(habito.id, fecha, !checked)}
                      aria-label={`${DIAS_SEMANA[i]} ${fecha}${esHoy ? ', hoy' : ''}`}
                    >
                      <span className="habito-dia-letra">{DIAS_SEMANA[i]}</span>
                      <span className="habito-circulo" aria-hidden="true">
                        {checked ? '●' : '○'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

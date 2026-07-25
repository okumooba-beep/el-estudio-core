import { useIdeas, IdeaSheet } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { describeDay } from '@shared-kernel/date/describeDay'

/**
 * Sprint 3.3, tarea 3: la Libreta abre esto — no un módulo nuevo, una
 * pantalla mínima sobre datos que ya existen. Cada Idea alguna vez
 * escrita, en el mismo orden que ya trae useIdeas (más reciente
 * primero), con la misma <IdeaSheet> de siempre. Sin categorías, sin
 * filtros, sin botones extra: la libreta es el Diario, nada más.
 */
export function DiarioScreen() {
  const { ideas, ready } = useIdeas()

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 pt-2">
      {!ready ? null : ideas.length === 0 ? (
        <EmptyState
          title="Todavía no escribiste nada."
          description="Lo que escribas en el Estudio va a quedar acá."
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {ideas.map((idea) => (
            <li key={idea.id} className="flex flex-col gap-1">
              <IdeaSheet idea={idea} />
              <p className="text-[13px] text-ink-faint">Escrita {describeDay(idea.fecha)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

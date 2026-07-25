import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdeas } from '@modules/work-table/public'
import { useHabitChecks } from '@modules/habits/public'

/**
 * Build Core V1 — vistazo de hábitos: mismos datos que HabitosScreen
 * (Ideas con destino 'habitos' + useHabitChecks), reducidos al estado
 * de HOY solamente — la grilla semanal completa sigue viviendo solo en
 * el Tablero de Hábitos (mismo criterio que Misión Principal: acá se
 * señala, nunca se duplica la lógica de marcar). Tocar cualquier fila
 * lleva al Tablero, donde sí se puede tocar cada círculo.
 */
export function HabitsGlance() {
  const { ideas, ready } = useIdeas()
  const { checks, ready: checksReady } = useHabitChecks()
  const navigate = useNavigate()

  const habitos = useMemo(() => ideas.filter((idea) => idea.destino === 'habitos'), [ideas])
  const hoyISO = new Date().toISOString().slice(0, 10)

  if (!ready || !checksReady || habitos.length === 0) return null

  return (
    <section className="pb-6">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Hábitos de hoy</h2>
      <button
        type="button"
        onClick={() => navigate('/habitos')}
        className="group flex w-full flex-col gap-2.5 appearance-none border-0 bg-transparent p-0 text-left"
      >
        {habitos.map((habito) => {
          const marcado = checks.some((c) => c.habitId === habito.id && c.fecha === hoyISO && c.checked)
          return (
            <div key={habito.id} className="flex items-center gap-2.5">
              <span aria-hidden="true" className={marcado ? 'text-accent' : 'text-ink-faint'}>
                {marcado ? '●' : '○'}
              </span>
              <span className="line-clamp-1 text-[15px] text-ink-dim transition-colors duration-150 group-hover:text-ink group-active:text-ink">
                {habito.texto}
              </span>
            </div>
          )
        })}
      </button>
    </section>
  )
}

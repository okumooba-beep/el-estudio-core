import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdeas } from '@modules/work-table/public'
import { useHabitChecks } from '@modules/habits/public'

/**
 * Core V2 — el punto de cada hábito deja de ser un ícono mudo y pasa a
 * ser el mismo botón que ya usa el Tablero (HabitosScreen.tsx: mismo
 * `toggle(habitId, fecha, checked)` de useHabitChecks, mismo criterio
 * optimista) para marcar HOY sin salir del Umbral. La grilla semanal
 * completa sigue viviendo solo en el Tablero — acá nunca se duplica esa
 * lógica, solo se extiende el mismo toggle a un solo día. El nombre del
 * hábito sigue llevando al Tablero, como antes.
 */
export function HabitsGlance() {
  const { ideas, ready } = useIdeas()
  const { checks, ready: checksReady, toggle } = useHabitChecks()
  const navigate = useNavigate()

  const habitos = useMemo(() => ideas.filter((idea) => idea.destino === 'habitos'), [ideas])
  const hoyISO = new Date().toISOString().slice(0, 10)

  if (!ready || !checksReady || habitos.length === 0) return null

  const marcadoHoy = (habitoId: string) => checks.some((c) => c.habitId === habitoId && c.fecha === hoyISO && c.checked)
  const todosMarcados = habitos.every((habito) => marcadoHoy(habito.id))

  return (
    <section className="pb-6">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Hábitos de hoy</h2>
      <div className="flex flex-col gap-2.5">
        {habitos.map((habito) => {
          const marcado = marcadoHoy(habito.id)
          return (
            <div key={habito.id} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => toggle(habito.id, hoyISO, !marcado)}
                aria-pressed={marcado}
                aria-label={`${habito.texto}, ${marcado ? 'hecho hoy' : 'marcar hoy'}`}
                className={`habito-punto${marcado ? ' habito-punto-marcado' : ''}`}
              >
                <span aria-hidden="true">{marcado ? '●' : '○'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/habitos')}
                className="line-clamp-1 flex-1 text-left text-[15px] text-ink-dim transition-colors duration-150 active:text-ink"
              >
                {habito.texto}
              </button>
            </div>
          )
        })}
      </div>
      {todosMarcados ? (
        <p className="mt-3 text-[13.5px] text-ink-faint">Ya hiciste lo que tenías que hacer hoy.</p>
      ) : null}
    </section>
  )
}

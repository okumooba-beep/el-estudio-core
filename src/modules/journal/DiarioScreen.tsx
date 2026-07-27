import { useMemo } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { describeDay } from '@shared-kernel/date/describeDay'

/**
 * Threshold Experience V1 — "el Diario es solo pensamientos": el Diario
 * mostraba antes TODAS las Ideas alguna vez escritas, sin importar su
 * destino (Sprint 3.3) — una misión ya movida al Tablero, un hábito, una
 * nota de Trading, seguían apareciendo acá para siempre. Eso contradice
 * lo que el Diario dice ser: "Todo lo que escribiste, en un solo lugar"
 * dejó de ser cierto en cuanto algo encontraba otro hogar. Ahora el
 * filtro es `destino === 'hoy'`: el único destino que significa
 * literalmente "nadie la redirigió a otro mueble todavía" — el registro
 * real de lo que quedó como pensamiento y nada más. No hace falta ningún
 * campo nuevo: 'hoy' ya es un destino real (ver src/types/idea.ts), no
 * un estado transitorio.
 *
 * El envoltorio deja de ser <IdeaSheet> (la hoja física de post-it que
 * usan Escritorio/Misiones/Hábitos): acá no hay chinchetas ni papeles
 * apilados, hay una página continua (.diario-pagina, ver index.css) — la
 * fecha vive en el margen, como en un cuaderno real, y el texto fluye
 * sin caja ni rotación ni sombra propia.
 */
export function DiarioScreen() {
  const { ideas, ready } = useIdeas()
  const pensamientos = useMemo(() => ideas.filter((idea) => idea.destino === 'hoy'), [ideas])

  return (
    <div className="mx-auto flex max-w-xl flex-col pt-2">
      {!ready ? null : pensamientos.length === 0 ? (
        <EmptyState
          title="Todavía no escribiste nada."
          description="Lo que escribas en el Umbral y se quede como Idea va a quedar acá."
        />
      ) : (
        <div className="diario-pagina">
          {pensamientos.map((idea) => (
            <article key={idea.id} className="diario-entrada">
              <span className="diario-fecha">{describeDay(idea.fecha)}</span>
              <p className="diario-texto">{idea.texto}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

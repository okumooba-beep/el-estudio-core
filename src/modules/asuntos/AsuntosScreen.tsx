import { useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { ASUNTO_ESTADOS, ESTADO_LABEL, describirEspera, diasEsperando, estadoDe, type AsuntoEstado } from './estados'
import type { Idea } from '@/types/idea'

/** Los abiertos primero, en el orden de EL_ESTUDIO_CORE.md; lo completado cierra abajo. */
const ABIERTOS: readonly AsuntoEstado[] = ['pendiente', 'en-progreso', 'en-espera']

/**
 * Asuntos (Sprint de Producto 003) — el destino que faltaba.
 *
 * EL_ESTUDIO_CORE.md lo define por lo que NO es: "No son tareas. No son
 * proyectos. No son recordatorios. Son situaciones que requieren
 * seguimiento." La pregunta que lo separa de Misiones es una sola:
 * ¿podés empezarlo vos ahora mismo? Si sí, es una misión. Si dependés
 * de que otro haga algo, es un asunto.
 *
 * Por eso esta pantalla no se parece al Tablero. Una misión se clava en
 * el corcho porque te espera a vos; un asunto descansa en la bandeja
 * porque espera a otro. Lo único que un asunto hace es cambiar de
 * estado, así que el estado es la estructura de la pantalla — no una
 * etiqueta colgada al costado de una lista.
 *
 * El tiempo de espera es la única información añadida, y es la que hace
 * la pantalla útil: en algo que depende de un tercero, cuánto lleva
 * esperando es exactamente el dato que decide si hoy toca reclamarlo.
 *
 * Deliberadamente ausentes: prioridad, fecha límite, responsable,
 * notas, recordatorios. Todos convertirían un asunto en un proyecto en
 * miniatura, que es lo que el propio documento prohíbe.
 *
 * No importa `@world` (dependency-cruiser `module-no-world`): las
 * excepciones son código anterior a F16 y un módulo nuevo no las hereda.
 */
export function AsuntosScreen() {
  const { ideas, ready, update } = useIdeas()
  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const ahora = new Date()

  const asuntos = ideas.filter((idea) => idea.destino === 'asuntos')
  const porEstado = (estado: AsuntoEstado) => asuntos.filter((asunto) => estadoDe(asunto) === estado)
  const completados = porEstado('completado')
  const hayAbiertos = ABIERTOS.some((estado) => porEstado(estado).length > 0)

  function cambiarEstado(asunto: Idea, estado: AsuntoEstado) {
    update(asunto.id, { estado })
    setAbiertoId(null)
  }

  if (!ready) return null

  if (asuntos.length === 0) {
    return (
      <EmptyState
        title="Nada esperando a nadie."
        description="Escribí algo que dependa de otra persona — “esperando la factura de César” — y el Estudio lo va a traer acá."
      />
    )
  }

  function renderAsunto(asunto: Idea) {
    const estado = estadoDe(asunto)
    const abierto = abiertoId === asunto.id
    const completado = estado === 'completado'

    return (
      <li key={asunto.id} className="border-b border-border/40 last:border-b-0">
        <button
          type="button"
          onClick={() => setAbiertoId(abierto ? null : asunto.id)}
          className="flex w-full flex-col items-start gap-1 py-3.5 text-left"
          aria-expanded={abierto}
        >
          <span className={['text-[17px] leading-snug', completado ? 'text-ink-faint line-through' : 'text-ink'].join(' ')}>
            {asunto.texto}
          </span>
          <span className="font-mono text-[12px] text-ink-faint">
            {describirEspera(diasEsperando(asunto, ahora))}
          </span>
        </button>
        {abierto ? (
          <div className="idea-destinos pb-3" role="group" aria-label="Cambiar estado">
            {ASUNTO_ESTADOS.filter((siguiente) => siguiente !== estado).map((siguiente) => (
              <button
                key={siguiente}
                type="button"
                className="idea-destino"
                onClick={() => cambiarEstado(asunto, siguiente)}
              >
                {ESTADO_LABEL[siguiente]}
              </button>
            ))}
          </div>
        ) : null}
      </li>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      {ABIERTOS.map((estado) => {
        const delEstado = porEstado(estado)
        if (delEstado.length === 0) return null
        return (
          <section key={estado}>
            <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">{ESTADO_LABEL[estado]}</h2>
            <ul className="flex flex-col">{delEstado.map(renderAsunto)}</ul>
          </section>
        )
      })}

      {!hayAbiertos ? (
        <EmptyState title="Nada abierto." description="Todo lo que dependía de alguien más está resuelto." />
      ) : null}

      {completados.length > 0 ? (
        <section>
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            {ESTADO_LABEL.completado}
          </h2>
          <ul className="flex flex-col">{completados.map(renderAsunto)}</ul>
        </section>
      ) : null}
    </div>
  )
}

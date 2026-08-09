import { useEffect, useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAgenda } from './useAgenda'
import { extraerFecha, extraerHora } from './extraccionFecha'
import { aItems, agruparPorCuando, semanaCalendario, type AgendaItem } from './agrupar'

type Modo = 'diaria' | 'planificacion'

/**
 * Agenda ("¿qué pasa y cuándo?"). Sin botón de "Nuevo evento": los
 * Eventos nacen en el Umbral, este efecto solo los convierte apenas
 * llegan (mismo patrón que FinanceScreen con los movimientos). Los
 * Bloques nacen acá mismo, pero solo dentro de Planificación semanal —
 * la vista diaria nunca los crea, solo los muestra.
 */
export function AgendaScreen() {
  const { eventos, bloques, ready, addEvento, updateEvento, addBloque, updateBloque } = useAgenda()
  const { ideas } = useIdeas()
  const [modo, setModo] = useState<Modo>('diaria')
  const [editandoDia, setEditandoDia] = useState<string | null>(null)
  const [textoBloque, setTextoBloque] = useState('')
  const [editandoBloqueId, setEditandoBloqueId] = useState<string | null>(null)
  const [textoEdicionBloque, setTextoEdicionBloque] = useState('')

  const convertidas = useMemo(() => new Set(eventos.map((evento) => evento.ideaId)), [eventos])
  const pendientes = ideas.filter((idea) => idea.destino === 'agenda' && !convertidas.has(idea.id))

  useEffect(() => {
    if (!ready) return
    for (const idea of pendientes) {
      void addEvento({
        texto: idea.texto,
        fecha: extraerFecha(idea.texto),
        hora: extraerHora(idea.texto),
        alarma: false,
        ideaId: idea.id,
      })
    }
    // Se re-ejecuta cuando cambian ideas o eventos: cada alta reduce
    // `pendientes` en el próximo render (mismo patrón que FinanceScreen).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ideas, eventos])

  const bloquesActivos = useMemo(() => bloques.filter((bloque) => !bloque.archivado), [bloques])

  const itemsPendientes = useMemo(
    () => aItems(eventos, bloquesActivos).filter((item) => !item.completado),
    [eventos, bloquesActivos],
  )
  const buckets = useMemo(() => agruparPorCuando(itemsPendientes), [itemsPendientes])
  const semana = useMemo(() => semanaCalendario(), [])

  function completar(item: AgendaItem) {
    if (item.tipo === 'evento') void updateEvento(item.id, { completado: true })
    else void updateBloque(item.id, { completado: true })
  }

  function alternarAlarma(item: AgendaItem) {
    if (item.tipo === 'evento') void updateEvento(item.id, { alarma: !item.item.alarma })
    else void updateBloque(item.id, { alarma: !item.item.alarma })
  }

  /**
   * Sprint 010, punto 6: cargar varios Bloques seguidos era el problema
   * real, no un límite de datos — por eso ya no cierra editandoDia acá,
   * el input queda listo para el siguiente Bloque del mismo día.
   */
  function agregarBloque(dia: string) {
    const texto = textoBloque.trim()
    setTextoBloque('')
    if (!texto) return
    void addBloque({ texto, dia, hora: extraerHora(texto), alarma: false })
  }

  function iniciarEdicionBloque(id: string, texto: string) {
    setEditandoBloqueId(id)
    setTextoEdicionBloque(texto)
  }

  function guardarEdicionBloque(id: string) {
    const texto = textoEdicionBloque.trim()
    setEditandoBloqueId(null)
    if (!texto) return
    void updateBloque(id, { texto, hora: extraerHora(texto) })
  }

  function archivarBloque(id: string) {
    void updateBloque(id, { archivado: true })
  }

  if (!ready) return null

  if (modo === 'planificacion') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
        <button type="button" className="idea-destino self-start" onClick={() => setModo('diaria')}>
          ← Volver a la vista diaria
        </button>
        <h1 className="font-mono text-[11px] uppercase tracking-wide text-accent">Planificación semanal</h1>
        <ul className="flex flex-col gap-5">
          {semana.map((dia) => {
            const eventosDelDia = eventos
              .filter((evento) => evento.fecha === dia)
              .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
            const bloquesDelDia = bloquesActivos
              .filter((bloque) => bloque.dia === dia)
              .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
            return (
              <li key={dia} className="flex flex-col gap-2 border-b border-border/40 pb-4 last:border-b-0">
                <p className="text-[13px] text-ink-dim">{nombreDia(dia)}</p>
                {eventosDelDia.map((evento) => (
                  <p key={evento.id} className="text-[14px] text-ink-faint">
                    {evento.hora ? `${evento.hora} · ` : ''}
                    {evento.texto}
                  </p>
                ))}
                {bloquesDelDia.map((bloque) =>
                  editandoBloqueId === bloque.id ? (
                    <input
                      key={bloque.id}
                      autoFocus
                      className="border-b border-border/60 bg-transparent text-[15px] text-ink outline-none"
                      value={textoEdicionBloque}
                      onChange={(evento) => setTextoEdicionBloque(evento.target.value)}
                      onKeyDown={(evento) => {
                        if (evento.key === 'Enter') {
                          evento.preventDefault()
                          guardarEdicionBloque(bloque.id)
                        }
                        if (evento.key === 'Escape') setEditandoBloqueId(null)
                      }}
                      onBlur={() => guardarEdicionBloque(bloque.id)}
                    />
                  ) : (
                    <p key={bloque.id} className="agenda-bloque text-[15px] text-ink">
                      <span className="agenda-bloque-texto">
                        {bloque.hora ? `${bloque.hora} · ` : ''}
                        {bloque.texto}
                      </span>
                      <span className="agenda-bloque-acciones">
                        <button
                          type="button"
                          className="agenda-bloque-accion"
                          onClick={() => iniciarEdicionBloque(bloque.id, bloque.texto)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="agenda-bloque-accion"
                          onClick={() => archivarBloque(bloque.id)}
                        >
                          Archivar
                        </button>
                      </span>
                    </p>
                  ),
                )}
                {editandoDia === dia ? (
                  <input
                    autoFocus
                    className="border-b border-border/60 bg-transparent text-[15px] text-ink outline-none"
                    value={textoBloque}
                    placeholder="Gimnasio 7 a 8"
                    onChange={(evento) => setTextoBloque(evento.target.value)}
                    onKeyDown={(evento) => {
                      if (evento.key === 'Enter') {
                        evento.preventDefault()
                        agregarBloque(dia)
                      }
                      if (evento.key === 'Escape') {
                        setEditandoDia(null)
                        setTextoBloque('')
                      }
                    }}
                    onBlur={() => {
                      setEditandoDia(null)
                      setTextoBloque('')
                    }}
                  />
                ) : (
                  <button type="button" className="idea-destino self-start" onClick={() => setEditandoDia(dia)}>
                    + Bloque
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  const sinNada =
    buckets.ahora.length === 0 &&
    buckets.hoy.length === 0 &&
    buckets.manana.length === 0 &&
    buckets.estaSemana.length === 0

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Agenda</p>
        <button type="button" className="idea-destino" onClick={() => setModo('planificacion')}>
          Planificación semanal
        </button>
      </div>
      {sinNada ? (
        <EmptyState
          title="Nada por delante."
          description="Escribí algo con fecha u hora en el Umbral — “Turno con el dentista el jueves a las 10”— y aparece acá."
        />
      ) : (
        <>
          <Seccion titulo="Ahora" items={buckets.ahora} onCompletar={completar} onAlarma={alternarAlarma} />
          <Seccion titulo="Hoy" items={buckets.hoy} onCompletar={completar} onAlarma={alternarAlarma} />
          <Seccion titulo="Mañana" items={buckets.manana} onCompletar={completar} onAlarma={alternarAlarma} />
          <Seccion titulo="Esta semana" items={buckets.estaSemana} onCompletar={completar} onAlarma={alternarAlarma} />
        </>
      )}
    </div>
  )
}

function Seccion({
  titulo,
  items,
  onCompletar,
  onAlarma,
}: {
  titulo: string
  items: AgendaItem[]
  onCompletar: (item: AgendaItem) => void
  onAlarma: (item: AgendaItem) => void
}) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">{titulo}</h2>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 border-b border-border/40 py-3 last:border-b-0">
            <button
              type="button"
              aria-label="Completar"
              className="h-4 w-4 shrink-0 rounded-full border border-ink-faint transition-colors hover:border-accent"
              onClick={() => onCompletar(item)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-snug text-ink">{item.texto}</p>
              {item.hora ? <p className="text-[12.5px] text-ink-faint">{item.hora}</p> : null}
            </div>
            <button
              type="button"
              className="idea-destino shrink-0"
              aria-pressed={item.item.alarma}
              style={item.item.alarma ? { color: 'var(--accent)' } : undefined}
              onClick={() => onAlarma(item)}
            >
              Alarma
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function nombreDia(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`)
  const texto = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

import { useEffect, useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAgenda } from './useAgenda'
import { extraerFecha, extraerHora, interpretarEvento } from './extraccionFecha'
import { aItems, agruparPorCuando, semanaCalendario, type AgendaItem } from './agrupar'
import { calcularConflictosDia } from './conflictos'
import type { AgendaEvento, AgendaBloque, AgendaPrioridad } from '@/types/agenda'

type Modo = 'diaria' | 'planificacion'

const SIGUIENTE_PRIORIDAD: Record<AgendaPrioridad, AgendaPrioridad> = {
  normal: 'importante',
  importante: 'urgente',
  urgente: 'normal',
}

function rotuloPrioridad(prioridad: AgendaPrioridad): string {
  return prioridad === 'normal' ? 'Normal' : prioridad === 'importante' ? 'Importante' : 'Urgente'
}

/**
 * Agenda ("¿qué pasa y cuándo?"). Sin botón de "Nuevo evento": los
 * Eventos nacen en el Umbral, este efecto solo los convierte apenas
 * llegan (mismo patrón que FinanceScreen con los movimientos). Los
 * Bloques nacen acá mismo, pero solo dentro de Planificación semanal —
 * la vista diaria nunca los crea, solo los muestra.
 */
export function AgendaScreen() {
  const { eventos, bloques, ready, addEvento, updateEvento, addBloque, updateBloque, removeBloque } = useAgenda()
  const { ideas, moveSheet } = useIdeas()
  const [modo, setModo] = useState<Modo>('diaria')
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [editandoDia, setEditandoDia] = useState<string | null>(null)
  const [textoBloque, setTextoBloque] = useState('')
  const [copiarSemana, setCopiarSemana] = useState(false)
  const [editandoBloqueId, setEditandoBloqueId] = useState<string | null>(null)
  const [textoEdicionBloque, setTextoEdicionBloque] = useState('')
  const [conflictoAbierto, setConflictoAbierto] = useState<string | null>(null)
  const [editandoEventoId, setEditandoEventoId] = useState<string | null>(null)
  const [textoEdicionEvento, setTextoEdicionEvento] = useState('')

  const convertidas = useMemo(() => new Set(eventos.map((evento) => evento.ideaId)), [eventos])
  const pendientes = ideas.filter((idea) => idea.destino === 'agenda' && !convertidas.has(idea.id))

  useEffect(() => {
    if (!ready) return
    for (const idea of pendientes) {
      const { fecha, hora, prioridad, textoLimpio } = interpretarEvento(idea.texto)
      void addEvento({
        texto: textoLimpio || idea.texto,
        fecha,
        hora,
        prioridad: prioridad ?? 'normal',
        alarma: false,
        ideaId: idea.id,
      })
    }
    // Se re-ejecuta cuando cambian ideas o eventos: cada alta reduce
    // `pendientes` en el próximo render (mismo patrón que FinanceScreen).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ideas, eventos])

  const bloquesActivos = useMemo(() => bloques.filter((bloque) => !bloque.archivado), [bloques])

  /**
   * Sprint 013, punto 1: Misiones con "Programada para" — Agenda las lee
   * directo de acá (mismo store que Misiones vía useIdeas), nunca las
   * copia a otra tabla. Sin `programadaFecha`: no existe para Agenda.
   */
  const misionesProgramadas = useMemo(
    () => ideas.filter((idea) => idea.destino === 'misiones' && idea.programadaFecha),
    [ideas],
  )

  const itemsPendientes = useMemo(
    () => aItems(eventos, bloquesActivos, misionesProgramadas).filter((item) => !item.completado),
    [eventos, bloquesActivos, misionesProgramadas],
  )
  const buckets = useMemo(() => agruparPorCuando(itemsPendientes), [itemsPendientes])
  /**
   * Sprint 012, punto 6: solo Eventos importantes/urgentes que todavía
   * no aparecen en Ahora/Hoy/Mañana — evita mostrar el mismo Evento dos
   * veces (spec: "nunca... dos listas distintas").
   */
  const proximoImportante = useMemo(
    () =>
      buckets.estaSemana.filter(
        (item): item is AgendaItem & { tipo: 'evento' } =>
          item.tipo === 'evento' && (item.item.prioridad === 'importante' || item.item.prioridad === 'urgente'),
      ),
    [buckets],
  )
  const semana = useMemo(() => semanaCalendario(undefined, semanaOffset), [semanaOffset])

  /**
   * Sprint 013, punto 3: completar una Misión desde Agenda usa el mismo
   * moveSheet que Misiones — no hay sincronización porque ambas vistas
   * leen del mismo store compartido (useIdeas), el cambio se ve en las
   * dos apenas se aplica.
   */
  function completar(item: AgendaItem) {
    if (item.tipo === 'evento') void updateEvento(item.id, { completado: true })
    else if (item.tipo === 'bloque') void updateBloque(item.id, { completado: true })
    else void moveSheet(item.item, 'archivador')
  }

  function alternarAlarma(item: AgendaItem) {
    if (item.tipo === 'evento') void updateEvento(item.id, { alarma: !item.item.alarma })
    else if (item.tipo === 'bloque') void updateBloque(item.id, { alarma: !item.item.alarma })
  }

  /** Sprint 012, punto 5: solo Eventos ciclan prioridad — los Bloques nunca la usan. */
  function ciclarPrioridad(item: AgendaItem) {
    if (item.tipo !== 'evento') return
    void updateEvento(item.id, { prioridad: SIGUIENTE_PRIORIDAD[item.item.prioridad] })
  }

  /**
   * Sprint 011, punto 1: el "Bloque desaparece" reportado era el
   * `onBlur` del input cerrando `editandoDia` — en el teclado virtual
   * de un celular, Enter dispara blur además del keydown, así que el
   * panel se cerraba solo tras cada guardado (ver el input más abajo:
   * ya no tiene onBlur). Acá solo agrega, nunca cierra el contexto.
   *
   * Punto 5 — "Copiar al resto de la semana": crea un Bloque
   * independiente por cada día de `semana`, mismo texto/hora, sin
   * ninguna relación entre copias (no es una recurrencia).
   */
  function agregarBloque(dia: string) {
    const texto = textoBloque.trim()
    const copiar = copiarSemana
    setTextoBloque('')
    setCopiarSemana(false)
    if (!texto) return
    const hora = extraerHora(texto)
    const dias = copiar ? semana : [dia]
    for (const d of dias) {
      void addBloque({ texto, dia: d, hora, alarma: false })
    }
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

  function iniciarEdicionEvento(id: string, texto: string) {
    setConflictoAbierto(null)
    setEditandoEventoId(id)
    setTextoEdicionEvento(texto)
  }

  function guardarEdicionEvento(id: string) {
    const texto = textoEdicionEvento.trim()
    const eventoActual = eventos.find((evento) => evento.id === id)
    setEditandoEventoId(null)
    if (!texto || !eventoActual) return
    void updateEvento(id, { texto, fecha: extraerFecha(texto, eventoActual.fecha), hora: extraerHora(texto) })
  }

  function moverBloqueDesdeConflicto(bloque: AgendaBloque) {
    setConflictoAbierto(null)
    iniciarEdicionBloque(bloque.id, bloque.texto)
  }

  function eliminarBloqueDesdeConflicto(bloqueId: string) {
    setConflictoAbierto(null)
    void removeBloque(bloqueId)
  }

  if (!ready) return null

  if (modo === 'planificacion') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
        <button type="button" className="idea-destino self-start" onClick={() => setModo('diaria')}>
          ← Volver a la vista diaria
        </button>
        <h1 className="font-mono text-[11px] uppercase tracking-wide text-accent">Planificación semanal</h1>
        <div className="flex items-center justify-between">
          <button type="button" className="idea-destino" onClick={() => setSemanaOffset(0)}>
            ← Semana actual
          </button>
          <button type="button" className="idea-destino" onClick={() => setSemanaOffset((o) => o + 1)}>
            Semana siguiente →
          </button>
        </div>
        <ul className="flex flex-col gap-5">
          {semana.map((dia) => {
            const eventosDelDia = eventos.filter((evento) => evento.fecha === dia)
            const bloquesDelDia = bloquesActivos.filter((bloque) => bloque.dia === dia)
            const misionesDelDia = misionesProgramadas.filter((mision) => mision.programadaFecha === dia)
            const { conflictosPorEvento, bloqueIdsEnConflicto } = calcularConflictosDia(eventosDelDia, bloquesDelDia)
            const itemsDelDia = aItems(eventosDelDia, bloquesDelDia, misionesDelDia).sort((a, b) =>
              (a.hora ?? '').localeCompare(b.hora ?? ''),
            )
            return (
              <li key={dia} className="flex flex-col gap-2 border-b border-border/40 pb-4 last:border-b-0">
                <p className="text-[13px] text-ink-dim">{nombreDia(dia)}</p>
                {itemsDelDia.map((item) => {
                  if (item.tipo === 'bloque' && bloqueIdsEnConflicto.has(item.id)) return null

                  if (item.tipo === 'evento' && conflictosPorEvento.has(item.id)) {
                    return (
                      <ConflictoIndicador
                        key={item.id}
                        evento={item.item}
                        bloques={conflictosPorEvento.get(item.id)!}
                        abierto={conflictoAbierto === item.id}
                        onAbrir={() => setConflictoAbierto(item.id)}
                        onCerrar={() => setConflictoAbierto(null)}
                        onEditarHorario={() => iniciarEdicionEvento(item.id, item.item.texto)}
                        onMoverBloque={moverBloqueDesdeConflicto}
                        onEliminarBloque={eliminarBloqueDesdeConflicto}
                      />
                    )
                  }

                  if (item.tipo === 'evento') {
                    if (editandoEventoId === item.id) {
                      return (
                        <input
                          key={item.id}
                          autoFocus
                          className="border-b border-border/60 bg-transparent text-[15px] text-ink outline-none"
                          value={textoEdicionEvento}
                          onChange={(evento) => setTextoEdicionEvento(evento.target.value)}
                          onKeyDown={(evento) => {
                            if (evento.key === 'Enter') {
                              evento.preventDefault()
                              guardarEdicionEvento(item.id)
                            }
                            if (evento.key === 'Escape') setEditandoEventoId(null)
                          }}
                          onBlur={() => guardarEdicionEvento(item.id)}
                        />
                      )
                    }
                    return (
                      <p key={item.id} className="text-[14px] text-ink-faint">
                        {item.hora ? `${item.hora} · ` : ''}
                        {item.texto}
                      </p>
                    )
                  }

                  if (item.tipo === 'mision') {
                    return (
                      <p key={item.id} className="text-[14px] text-ink-faint">
                        □ {item.hora ? `${item.hora} · ` : ''}
                        {item.texto}
                      </p>
                    )
                  }

                  const bloque = item.item
                  return editandoBloqueId === bloque.id ? (
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
                  )
                })}
                {editandoDia === dia ? (
                  <div className="flex flex-col gap-1.5">
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
                          setCopiarSemana(false)
                        }
                      }}
                    />
                    <label className="flex items-center gap-1.5 text-[12.5px] text-ink-faint">
                      <input
                        type="checkbox"
                        checked={copiarSemana}
                        onChange={(evento) => setCopiarSemana(evento.target.checked)}
                      />
                      Copiar al resto de la semana
                    </label>
                  </div>
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
    buckets.atrasado.length === 0 &&
    buckets.hoy.length === 0 &&
    buckets.manana.length === 0 &&
    proximoImportante.length === 0

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
          <Seccion titulo="Ahora" items={buckets.ahora} onCompletar={completar} onAlarma={alternarAlarma} onPrioridad={ciclarPrioridad} />
          <Seccion titulo="Atrasado" items={buckets.atrasado} onCompletar={completar} onAlarma={alternarAlarma} onPrioridad={ciclarPrioridad} />
          <Seccion titulo="Hoy" items={buckets.hoy} onCompletar={completar} onAlarma={alternarAlarma} onPrioridad={ciclarPrioridad} />
          <Seccion titulo="Mañana" items={buckets.manana} onCompletar={completar} onAlarma={alternarAlarma} onPrioridad={ciclarPrioridad} />
          <Seccion titulo="Próximo importante" items={proximoImportante} onCompletar={completar} onAlarma={alternarAlarma} onPrioridad={ciclarPrioridad} />
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
  onPrioridad,
}: {
  titulo: string
  items: AgendaItem[]
  onCompletar: (item: AgendaItem) => void
  onAlarma: (item: AgendaItem) => void
  onPrioridad: (item: AgendaItem) => void
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
              <p className="text-[15px] leading-snug text-ink">
                {item.tipo === 'mision' ? '□ ' : ''}
                {item.texto}
                {item.tipo === 'evento' && item.item.prioridad !== 'normal' ? (
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-faint">
                    {rotuloPrioridad(item.item.prioridad)}
                  </span>
                ) : null}
              </p>
              {item.hora ? <p className="text-[12.5px] text-ink-faint">{item.hora}</p> : null}
            </div>
            {item.tipo === 'evento' ? (
              <button
                type="button"
                className="idea-destino shrink-0"
                aria-pressed={item.item.prioridad !== 'normal'}
                style={item.item.prioridad !== 'normal' ? { color: 'var(--accent)' } : undefined}
                onClick={() => onPrioridad(item)}
              >
                {rotuloPrioridad(item.item.prioridad)}
              </button>
            ) : null}
            {item.tipo !== 'mision' ? (
              <button
                type="button"
                className="idea-destino shrink-0"
                aria-pressed={item.item.alarma}
                style={item.item.alarma ? { color: 'var(--accent)' } : undefined}
                onClick={() => onAlarma(item)}
              >
                Alarma
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ConflictoIndicador({
  evento,
  bloques,
  abierto,
  onAbrir,
  onCerrar,
  onEditarHorario,
  onMoverBloque,
  onEliminarBloque,
}: {
  evento: AgendaEvento
  bloques: AgendaBloque[]
  abierto: boolean
  onAbrir: () => void
  onCerrar: () => void
  onEditarHorario: () => void
  onMoverBloque: (bloque: AgendaBloque) => void
  onEliminarBloque: (bloqueId: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        className="flex flex-col items-start gap-0.5 text-left"
        onClick={() => (abierto ? onCerrar() : onAbrir())}
      >
        <span className="text-[14px] text-ink">⚠ Conflicto detectado</span>
        <span className="text-[12.5px] text-ink-faint">
          {evento.hora ? `${evento.hora} · ` : ''}
          {evento.texto}
        </span>
        {bloques.map((bloque) => (
          <span key={bloque.id} className="text-[12.5px] text-ink-faint">
            {bloque.hora ? `${bloque.hora} · ` : ''}
            {bloque.texto}
          </span>
        ))}
      </button>
      {abierto ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-1">
          <button type="button" className="idea-destino" onClick={onCerrar}>
            Resolver más tarde
          </button>
          <button type="button" className="idea-destino" onClick={onEditarHorario}>
            Editar horario
          </button>
          {bloques.map((bloque) => (
            <span key={bloque.id} className="flex items-center gap-3">
              <button type="button" className="idea-destino" onClick={() => onMoverBloque(bloque)}>
                Mover bloque
              </button>
              <button type="button" className="idea-destino" onClick={() => onEliminarBloque(bloque.id)}>
                Eliminar bloque
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function nombreDia(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`)
  const texto = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

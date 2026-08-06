import { Fragment, useEffect, useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useHabitChecks } from './useHabitChecks'
import { MUEBLES } from '@world/studio/muebles'
import type { Idea } from '@/types/idea'

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const ORDEN_KEY = 'habitos-orden'

function fechasSemanaActual(): string[] {
  const hoy = new Date()
  const offsetLunes = hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoy)
    dia.setDate(hoy.getDate() + offsetLunes + i)
    return dia.toISOString().slice(0, 10)
  })
}

function leerOrden(): string[] {
  try {
    const raw = localStorage.getItem(ORDEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function guardarOrden(orden: string[]) {
  localStorage.setItem(ORDEN_KEY, JSON.stringify(orden))
}

/**
 * Sprint 004 — "Sistema de práctica": Hábitos deja de ser una lista de
 * hojas de papel (Sprint 3.6) y pasa a ser una tabla semanal real. La
 * hoja (`IdeaSheet`, clase `material-paper`) queda afuera a propósito
 * — el brief pide explícitamente ninguna tarjeta ni post-it acá; el
 * nombre de cada hábito es ahora texto editable simple, sin envoltorio
 * físico. El orden de las filas es el único dato nuevo: vive en
 * localStorage (`habitos-orden`), no en IndexedDB — es una preferencia
 * de presentación, no un hecho del mundo, así que no toca el modelo
 * Idea ni el repositorio de checks.
 */
export function HabitosScreen() {
  const { ideas, ready, add, update, moveSheet } = useIdeas()
  const { checks, ready: checksReady, toggle } = useHabitChecks()
  const [draftTexto, setDraftTexto] = useState<string | null>(null)
  const [orden, setOrden] = useState<string[]>(() => leerOrden())
  const habitosSinOrden = ideas.filter((idea) => idea.destino === 'habitos')
  const semana = fechasSemanaActual()
  const semanaSet = useMemo(() => new Set(semana), [semana])
  const hoyISO = new Date().toISOString().slice(0, 10)

  const habitos = useMemo(() => {
    const porId = new Map(habitosSinOrden.map((h) => [h.id, h] as const))
    const ordenados = orden.map((id) => porId.get(id)).filter((h): h is Idea => Boolean(h))
    const nuevos = habitosSinOrden.filter((h) => !orden.includes(h.id))
    return [...ordenados, ...nuevos]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitosSinOrden, orden])

  // Todo hábito nuevo (o ya existente antes de que este sprint agregara
  // orden) queda al final la primera vez que aparece, y desde ahí ya
  // se persiste — así "cambiar orden" nunca depende de recordar crear
  // el registro antes.
  useEffect(() => {
    const ids = habitosSinOrden.map((h) => h.id)
    const faltantes = ids.filter((id) => !orden.includes(id))
    if (faltantes.length === 0) return
    const nuevoOrden = [...orden, ...faltantes]
    setOrden(nuevoOrden)
    guardarOrden(nuevoOrden)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitosSinOrden])

  const totalCeldas = habitos.length * 7
  const completadas = checks.filter(
    (c) => c.checked && semanaSet.has(c.fecha) && habitos.some((h) => h.id === c.habitId),
  ).length
  const porcentaje = totalCeldas > 0 ? Math.round((completadas / totalCeldas) * 100) : 0

  /**
   * Sprint 004.1 — racha actual: días consecutivos, terminando hoy,
   * en los que se marcó al menos una práctica. Si hoy todavía no tiene
   * ninguna marca, la racha sigue contando desde ayer (el día no
   * terminó todavía, no se corta por eso). Se calcula sobre los checks
   * que ya existen — ningún modelo ni tabla nueva.
   */
  const racha = useMemo(() => {
    const habitIds = new Set(habitos.map((h) => h.id))
    const dias = new Set(checks.filter((c) => c.checked && habitIds.has(c.habitId)).map((c) => c.fecha))
    let cursor = new Date()
    if (!dias.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
    let dias_seguidos = 0
    while (dias.has(cursor.toISOString().slice(0, 10))) {
      dias_seguidos += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return dias_seguidos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks, habitos])

  function moverOrden(id: string, direccion: -1 | 1) {
    const base = habitos.map((h) => h.id)
    const indice = base.indexOf(id)
    const destino = indice + direccion
    if (destino < 0 || destino >= base.length) return
    const copia = [...base]
    const temp = copia[indice]!
    copia[indice] = copia[destino]!
    copia[destino] = temp
    setOrden(copia)
    guardarOrden(copia)
  }

  function handleNombreBlur(habito: Idea, event: React.FocusEvent<HTMLSpanElement>) {
    const texto = event.currentTarget.textContent?.trim() ?? ''
    if (texto && texto !== habito.texto) void update(habito.id, { texto })
    else if (!texto) event.currentTarget.textContent = habito.texto
  }

  function handleNombreKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  /** Contrato §8: quitar un hábito es archivarlo, mismo acuerdo que Asuntos/Cuaderno — nunca un borrado real. */
  function handleArchivar(habito: Idea) {
    void moveSheet(habito, 'archivador')
  }

  function handleNuevoHabito() {
    setDraftTexto('')
  }

  async function handleDraftBlur() {
    const texto = (draftTexto ?? '').trim()
    setDraftTexto(null)
    if (!texto) return
    await add(texto, { destino: 'habitos', origen: 'habitos' })
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  if (!ready || !checksReady) return null

  return (
    <div className="flex flex-col gap-6 pt-2" data-mueble={MUEBLES.habitos}>
      {habitos.length > 0 ? (
        <div className="habito-resumen">
          <div className="habito-resumen-cabecera">
            <span>Progreso semanal</span>
            <span className="habito-resumen-porcentaje">{porcentaje}%</span>
          </div>
          <div
            className="habito-resumen-barra"
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="habito-resumen-barra-relleno" style={{ width: `${porcentaje}%` }} />
          </div>
          <div className="habito-resumen-pie">
            <p className="habito-resumen-detalle">
              <span>Prácticas completadas</span>
              <span className="habito-resumen-detalle-numero">
                {completadas} de {totalCeldas}
              </span>
            </p>
            <p className="habito-resumen-racha">🔥 {racha} {racha === 1 ? 'día' : 'días'}</p>
          </div>
        </div>
      ) : null}

      {habitos.length === 0 ? (
        <EmptyState
          title="Ningún hábito existe todavía."
          description="Agregá el primero para empezar tu semana."
        />
      ) : (
        <div className="habito-tabla">
          <span className="habito-tabla-vacio" aria-hidden="true" />
          {DIAS_SEMANA.map((letra) => (
            <span key={letra} className="habito-tabla-dia-cabecera">
              {letra}
            </span>
          ))}

          {habitos.map((habito, indice) => (
            <Fragment key={habito.id}>
              <span
                className="habito-nombre"
                contentEditable
                suppressContentEditableWarning
                onBlur={(event) => handleNombreBlur(habito, event)}
                onKeyDown={handleNombreKeyDown}
              >
                {habito.texto}
              </span>
              {semana.map((fecha, i) => {
                const checked = checks.some((c) => c.habitId === habito.id && c.fecha === fecha && c.checked)
                const esHoy = fecha === hoyISO
                return (
                  <button
                    key={fecha}
                    type="button"
                    className={`habito-dia${checked ? ' habito-dia-marcado' : ''}${esHoy ? ' habito-dia-hoy' : ''}`}
                    onClick={() => toggle(habito.id, fecha, !checked)}
                    aria-label={`${habito.texto}, ${DIAS_SEMANA[i]} ${fecha}${esHoy ? ', hoy' : ''}`}
                  >
                    {checked ? '●' : '○'}
                  </button>
                )
              })}
              <span className="habito-acciones">
                <button
                  type="button"
                  className="habito-mover"
                  aria-label="Mover arriba"
                  disabled={indice === 0}
                  onClick={() => moverOrden(habito.id, -1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="habito-mover"
                  aria-label="Mover abajo"
                  disabled={indice === habitos.length - 1}
                  onClick={() => moverOrden(habito.id, 1)}
                >
                  ▼
                </button>
                <button
                  type="button"
                  className="habito-archivar"
                  aria-label="Archivar"
                  onClick={() => handleArchivar(habito)}
                >
                  ×
                </button>
              </span>
            </Fragment>
          ))}
        </div>
      )}

      {draftTexto !== null ? (
        <input
          type="text"
          autoFocus
          value={draftTexto}
          onChange={(event) => setDraftTexto(event.target.value)}
          onBlur={handleDraftBlur}
          onKeyDown={handleDraftKeyDown}
          placeholder="Nombre del hábito"
          className="habito-nuevo-input"
        />
      ) : (
        <button type="button" className="habito-nuevo-boton" onClick={handleNuevoHabito}>
          + Nuevo hábito
        </button>
      )}
    </div>
  )
}

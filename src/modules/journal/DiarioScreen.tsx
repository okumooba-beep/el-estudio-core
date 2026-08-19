import { useEffect, useMemo, useRef, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import type { Idea } from '@/types/idea'
import type { FurnitureId } from '@world/studio/furniture'

/**
 * Reclasificar (D): una hoja que el Umbral clasificó mal ("Leer el
 * código de la disciplina" fue a Cuaderno en vez de Misiones) no tenía
 * forma de corregirse una vez que ya dejó el Umbral. Mismo vocabulario
 * de destinos que CORRECCION_DESTINOS en IdeaCapture.tsx, sin
 * 'escritorio': acá la hoja ya está en Cuaderno, así que no tiene
 * sentido "mudarla" al mismo lugar.
 */
const RECLASIFICAR_DESTINOS: readonly { id: FurnitureId; label: string }[] = [
  { id: 'tablero', label: 'Misiones' },
  { id: 'bandeja', label: 'Asuntos' },
  { id: 'habitos', label: 'Hábitos' },
  { id: 'mesa-analisis', label: 'Trading' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'biblioteca', label: 'Biblioteca' },
  { id: 'archivador', label: 'Archivo' },
]

/**
 * "THE NOTEBOOK" — rediseño completo, se descarta la versión anterior
 * (lista de post-its, luego página continua de solo lectura). El Diario
 * deja de ser una vitrina de lo ya escrito y pasa a ser el lugar donde
 * se escribe: abre directo en la página de hoy, con el cursor listo.
 * Nunca un formulario, nunca un botón "Guardar" — la escritura misma es
 * la interacción primaria, guardar es un efecto secundario silencioso.
 *
 * El filtro sigue siendo `destino === 'hoy'` (Threshold V1: el único
 * destino que significa "se quedó como pensamiento, nadie la mudó a
 * otro mueble") y sigue usando la misma puerta de siempre (`add()` de
 * useIdeas, sin mecanismo nuevo) — pero a diferencia del Umbral
 * (IdeaCapture.tsx), acá nunca corre el Motor de Comprensión: lo que se
 * escribe en el Diario nunca se propone para otro destino. Es la única
 * superficie del Estudio protegida de la clasificación — "el Diario no
 * es un gestor de tareas", así que nada de lo que entra acá puede
 * terminar en Misiones/Hábitos/Trading por su cuenta.
 */
function fechaDeHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Encabezado de página propio del Diario, no describeDay() (que
 * comparten Misiones/Hábitos/Trading para una evidencia mínima en una
 * línea) — acá el encabezado es el título de la página completa, y una
 * fecha cruda ("el 2026-07-20") no se siente como abrir un cuaderno de
 * verdad. Intl.DateTimeFormat ya vive en el navegador, ninguna
 * dependencia nueva.
 */
function fechaDePagina(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'Hoy'
  const ayer = new Date(`${hoy}T00:00:00`)
  ayer.setDate(ayer.getDate() - 1)
  if (fecha === ayer.toISOString().slice(0, 10)) return 'Ayer'
  return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(`${fecha}T00:00:00`),
  )
}

export function DiarioScreen() {
  const { ideas, ready, add, moveSheet } = useIdeas()
  const hoy = fechaDeHoy()

  const paginas = useMemo(() => {
    const porFecha = new Map<string, Idea[]>()
    for (const idea of ideas) {
      if (idea.destino !== 'hoy') continue
      const entradas = porFecha.get(idea.fecha)
      if (entradas) entradas.push(idea)
      else porFecha.set(idea.fecha, [idea])
    }
    for (const entradas of porFecha.values()) entradas.sort((a, b) => a.hora.localeCompare(b.hora))
    return porFecha
  }, [ideas])

  /**
   * Cuaderno V1.1 — antes una hoja mudada a Archivo desaparecía sin
   * dejar rastro en ningún lugar del Estudio (no existe pantalla propia
   * para 'archivo'). Acá, junto a la página del día que la vio nacer,
   * es donde tiene sentido volver a verla: mismo criterio que ya usa
   * `paginas`, filtrando por el otro destino.
   */
  const paginasArchivadas = useMemo(() => {
    const porFecha = new Map<string, Idea[]>()
    for (const idea of ideas) {
      if (idea.destino !== 'archivo') continue
      const entradas = porFecha.get(idea.fecha)
      if (entradas) entradas.push(idea)
      else porFecha.set(idea.fecha, [idea])
    }
    for (const entradas of porFecha.values()) entradas.sort((a, b) => a.hora.localeCompare(b.hora))
    return porFecha
  }, [ideas])

  // Más reciente primero — la página de hoy siempre existe en esta
  // lista, aunque todavía esté en blanco, porque es la única que se
  // puede escribir; las anteriores solo aparecen si tienen contenido.
  const fechas = useMemo(() => {
    const conTexto = [...paginas.keys()].sort((a, b) => b.localeCompare(a))
    return conTexto.includes(hoy) ? conTexto : [hoy, ...conTexto]
  }, [paginas, hoy])

  const [fechaActual, setFechaActual] = useState(hoy)
  const indice = fechas.indexOf(fechaActual)
  const puedeVerAnterior = indice < fechas.length - 1
  const puedeVerSiguiente = indice > 0
  const esHoy = fechaActual === hoy
  const entradas = paginas.get(fechaActual) ?? []
  const archivadas = paginasArchivadas.get(fechaActual) ?? []

  const [mostrarArchivadas, setMostrarArchivadas] = useState(false)
  const [moviendoId, setMoviendoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const borradorRef = useRef('')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  borradorRef.current = borrador

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [borrador, esHoy])

  /**
   * Red de seguridad de guardado (no la interacción principal, que es
   * onBlur más abajo): si el usuario cierra la app o cambia de pestaña
   * a mitad de un párrafo, esa escritura no se pierde. Nunca toca
   * estado de React acá — el componente puede ya estar desmontado.
   */
  useEffect(() => {
    function flush() {
      const texto = borradorRef.current.trim()
      if (texto) void add(texto)
      borradorRef.current = ''
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      flush()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleBlur() {
    const texto = borrador.trim()
    if (!texto) return
    void add(texto)
    setBorrador('')
    setJustSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setJustSaved(false), 900)
  }

  /**
   * Borrar por hoja (Cuaderno V1.1): el Contrato del Umbral §8 prohíbe
   * el borrado real ("las cosas se cierran o se archivan"), así que
   * "borrar" acá es mudar a Archivo — silencioso, sin confirmación,
   * igual que el descarte del Umbral (ver handleDescartar en
   * IdeaCapture.tsx). Reversible en cualquier momento desde la lista de
   * archivadas.
   */
  function handleArchivar(idea: Idea) {
    void moveSheet(idea, 'archivador')
  }

  function handleRestaurar(idea: Idea) {
    void moveSheet(idea, 'escritorio')
  }

  function handleMover(idea: Idea, furniture: FurnitureId) {
    void moveSheet(idea, furniture)
    setMoviendoId(null)
  }

  if (!ready) return null

  return (
    <div className="mx-auto flex max-w-xl flex-col pb-16 pt-8">
      <div className="cuaderno-luz" aria-hidden="true" />
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-accent">Cuaderno</p>
      <div className="diario-pagina material-paper">
      <header className="mb-6">
        <h1 className="diario-fecha-pagina">{fechaDePagina(fechaActual, hoy)}</h1>
      </header>

      <div>
        {entradas.map((idea) => (
          <div key={idea.id} className="diario-entrada">
            <p className="diario-parrafo">{idea.texto}</p>
            <div className="diario-entrada-acciones">
              <button
                type="button"
                className="diario-entrada-mover"
                onClick={() => setMoviendoId((actual) => (actual === idea.id ? null : idea.id))}
              >
                Mover
              </button>
              <button
                type="button"
                className="diario-entrada-borrar"
                aria-label="Borrar"
                onClick={() => handleArchivar(idea)}
              >
                ×
              </button>
            </div>
            {moviendoId === idea.id ? (
              <div className="idea-destinos" role="group" aria-label="Mover a otro destino">
                {RECLASIFICAR_DESTINOS.map((destino) => (
                  <button
                    key={destino.id}
                    type="button"
                    className="idea-destino"
                    onClick={() => handleMover(idea, destino.id)}
                  >
                    {destino.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {esHoy ? (
          <textarea
            ref={textareaRef}
            value={borrador}
            onChange={(event) => setBorrador(event.target.value)}
            onBlur={handleBlur}
            placeholder={entradas.length === 0 ? 'Empezá cuando quieras.' : 'Seguí escribiendo…'}
            rows={1}
            autoFocus
            className="diario-escritura"
            aria-label="Escribir"
          />
        ) : null}
      </div>

      {justSaved ? (
        <p className="diario-guardado" aria-live="polite">
          Guardado.
        </p>
      ) : null}

      {archivadas.length > 0 ? (
        <div className="diario-archivadas">
          <button type="button" className="diario-archivadas-toggle" onClick={() => setMostrarArchivadas((v) => !v)}>
            {mostrarArchivadas ? 'Ocultar archivadas' : 'Ver archivadas'}
          </button>
          {mostrarArchivadas
            ? archivadas.map((idea) => (
                <div key={idea.id} className="diario-archivada">
                  <p className="diario-parrafo diario-parrafo-archivada">{idea.texto}</p>
                  <button type="button" className="diario-archivada-restaurar" onClick={() => handleRestaurar(idea)}>
                    Restaurar
                  </button>
                </div>
              ))
            : null}
        </div>
      ) : null}
      </div>

      {fechas.length > 1 ? (
        <nav className="diario-nav">
          {puedeVerAnterior ? (
            <button type="button" onClick={() => setFechaActual(fechas[indice + 1] ?? fechaActual)}>
              ← Página anterior
            </button>
          ) : (
            <span />
          )}
          {puedeVerSiguiente ? (
            <button type="button" onClick={() => setFechaActual(fechas[indice - 1] ?? fechaActual)}>
              Página siguiente →
            </button>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}

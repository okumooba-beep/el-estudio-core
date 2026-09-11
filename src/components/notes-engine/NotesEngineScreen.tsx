import { useEffect, useState } from 'react'
import { esPinValido } from './pin'
import { EmptyState } from '@/components/ui/EmptyState'
import type { NotesEngineApi } from './createNotesEngine'
import type { NotesFolder, NotesNote } from '@/types/notes'

/**
 * UI del motor de carpetas+notas, parametrizada por título y copy del
 * estado vacío — usada tal cual por Notas (`notes/NotesScreen.tsx`) y por
 * Mi proyecto (`miproyecto/MiProyectoScreen.tsx`), cada uno con su propio
 * `useEngine()` (ver createNotesEngine.ts) apuntando a su propio par de
 * tablas Dexie.
 */
export interface NotesEngineScreenProps {
  engine: NotesEngineApi
  titulo: string
  descripcionVacio: string
  /**
   * Oculta el <p>{titulo}</p> chico en mayúsculas del header de la lista de
   * carpetas — pedido de "Mi proyecto" (MiProyectoScreen.tsx), que ya
   * muestra el nombre del espacio como encabezado de pantalla propio antes
   * de este componente; mostrarlo de nuevo acá lo duplicaba. Notas no pasa
   * esto y sigue mostrando su título como siempre.
   */
  ocultarTitulo?: boolean | undefined
  /**
   * Carpetas en grilla de tarjetas de ancho consistente en vez de lista
   * apilada a lo ancho completo — mismo pedido: que Mi Proyecto se sienta
   * como un espacio propio, no como Notas con otro título pegado arriba.
   * Notas no lo pasa y mantiene su lista de una columna.
   */
  carpetasEnGrilla?: boolean | undefined
}

export function NotesEngineScreen({ engine, titulo, descripcionVacio, ocultarTitulo, carpetasEnGrilla }: NotesEngineScreenProps) {
  const [carpetaAbiertaId, setCarpetaAbiertaId] = useState<string | null>(null)

  if (!engine.ready) return null

  const carpetaAbierta = engine.folders.find((f) => f.id === carpetaAbiertaId) ?? null

  if (carpetaAbierta) {
    return (
      <FolderView
        folder={carpetaAbierta}
        engine={engine}
        titulo={titulo}
        onVolver={() => setCarpetaAbiertaId(null)}
      />
    )
  }

  return (
    <FolderList
      engine={engine}
      titulo={titulo}
      descripcionVacio={descripcionVacio}
      onAbrir={setCarpetaAbiertaId}
      ocultarTitulo={ocultarTitulo}
      carpetasEnGrilla={carpetasEnGrilla}
    />
  )
}

interface FolderListProps {
  engine: NotesEngineApi
  titulo: string
  descripcionVacio: string
  onAbrir: (id: string) => void
  ocultarTitulo?: boolean | undefined
  carpetasEnGrilla?: boolean | undefined
}

function FolderList({ engine, titulo, descripcionVacio, onAbrir, ocultarTitulo, carpetasEnGrilla }: FolderListProps) {
  const [creando, setCreando] = useState(false)
  const [nombreNueva, setNombreNueva] = useState('')

  async function crearCarpeta() {
    const nombre = nombreNueva.trim()
    if (!nombre) return
    await engine.addFolder(nombre)
    setNombreNueva('')
    setCreando(false)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        {ocultarTitulo ? null : (
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent">{titulo}</p>
        )}
        <button type="button" className={`idea-destino ${ocultarTitulo ? 'ml-auto' : ''}`} onClick={() => setCreando((v) => !v)}>
          {creando ? 'Cancelar' : 'Nueva carpeta'}
        </button>
      </div>

      {creando ? (
        <div className="notas-tarjeta flex flex-col gap-2">
          <input
            autoFocus
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="Nombre de la carpeta"
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-dim"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void crearCarpeta()
            }}
          />
          <button type="button" className="idea-destino self-start disabled:opacity-40" disabled={!nombreNueva.trim()} onClick={crearCarpeta}>
            Guardar
          </button>
        </div>
      ) : null}

      {engine.folders.length === 0 && !creando ? (
        <EmptyState title="Ninguna carpeta todavía." description={descripcionVacio} />
      ) : (
        <ul className={carpetasEnGrilla ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-3'}>
          {engine.folders.map((folder) => (
            <FolderRow key={folder.id} folder={folder} engine={engine} onAbrir={() => onAbrir(folder.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

interface FolderRowProps {
  folder: NotesFolder
  engine: NotesEngineApi
  onAbrir: () => void
}

function FolderRow({ folder, engine, onAbrir }: FolderRowProps) {
  const [interactuando, setInteractuando] = useState(false)
  const [renombrando, setRenombrando] = useState(false)
  const [nombre, setNombre] = useState(folder.nombre)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  function alternarInteraccion() {
    setInteractuando((actual) => {
      if (actual) {
        setRenombrando(false)
        setConfirmandoBorrado(false)
      }
      return !actual
    })
  }

  async function guardarNombre() {
    const nuevo = nombre.trim()
    if (!nuevo) return
    await engine.renameFolder(folder.id, nuevo)
    setRenombrando(false)
    setInteractuando(false)
  }

  return (
    <li className="notas-tarjeta flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 appearance-none border-0 bg-transparent p-0 text-left" onClick={onAbrir}>
          <span className="truncate text-[15px] text-ink">{folder.nombre}</span>
          {folder.pinHash !== null ? (
            <span aria-label="Carpeta bloqueada con PIN" className="shrink-0 text-[12px] text-ink-faint">
              🔒
            </span>
          ) : null}
        </button>
        <button type="button" className="idea-destino shrink-0" onClick={alternarInteraccion} aria-expanded={interactuando}>
          ⋯
        </button>
      </div>

      {interactuando ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="idea-destino" onClick={() => (renombrando ? setRenombrando(false) : (setNombre(folder.nombre), setRenombrando(true)))}>
            {renombrando ? 'Cancelar' : 'Editar'}
          </button>
          <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado((v) => !v)}>
            Eliminar
          </button>
        </div>
      ) : null}

      {renombrando ? (
        <div className="flex flex-col gap-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void guardarNombre()
            }}
          />
          <button type="button" className="idea-destino self-start disabled:opacity-40" disabled={!nombre.trim()} onClick={guardarNombre}>
            Guardar
          </button>
        </div>
      ) : null}

      {confirmandoBorrado ? (
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-ink-faint">{folder.pinHash !== null ? '¿Eliminar carpeta y todo su contenido bloqueado?' : '¿Eliminar carpeta y sus notas?'}</span>
          <button
            type="button"
            className="idea-destino"
            style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}
            onClick={() => {
              void engine.deleteFolder(folder.id)
              setConfirmandoBorrado(false)
            }}
          >
            Eliminar
          </button>
          <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado(false)}>
            Cancelar
          </button>
        </div>
      ) : null}
    </li>
  )
}

interface FolderViewProps {
  folder: NotesFolder
  engine: NotesEngineApi
  titulo: string
  onVolver: () => void
}

function FolderView({ folder, engine, titulo, onVolver }: FolderViewProps) {
  const desbloqueada = engine.isUnlocked(folder)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <button type="button" className="idea-destino self-start" onClick={onVolver}>
          ← Volver a {titulo}
        </button>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-accent">{folder.nombre}</p>

      {desbloqueada ? (
        <FolderContent folder={folder} engine={engine} />
      ) : (
        <PinGate folder={folder} engine={engine} />
      )}
    </div>
  )
}

interface PinGateProps {
  folder: NotesFolder
  engine: NotesEngineApi
}

function PinGate({ folder, engine }: PinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  async function intentar() {
    if (!esPinValido(pin)) return
    const ok = await engine.tryUnlock(folder, pin)
    if (!ok) {
      setError(true)
      setPin('')
      return
    }
    setError(false)
  }

  return (
    <div className="notas-tarjeta flex flex-col gap-3">
      <p className="text-[14px] text-ink">Carpeta bloqueada. Ingresá el PIN de 4 dígitos.</p>
      <input
        autoFocus
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => {
          setError(false)
          setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
        }}
        placeholder="••••"
        className="w-24 border-b border-border/60 bg-transparent px-1 py-1.5 text-center text-[18px] tracking-[0.3em] text-ink outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void intentar()
        }}
      />
      {error ? <p className="text-[13px]" style={{ color: 'var(--critical)' }}>PIN incorrecto.</p> : null}
      <button type="button" className="idea-destino self-start disabled:opacity-40" disabled={!esPinValido(pin)} onClick={intentar}>
        Desbloquear
      </button>
    </div>
  )
}

interface FolderContentProps {
  folder: NotesFolder
  engine: NotesEngineApi
}

function FolderContent({ folder, engine }: FolderContentProps) {
  const [creando, setCreando] = useState(false)
  const [mostrarPin, setMostrarPin] = useState(false)

  useEffect(() => {
    void engine.cargarNotas(folder.id)
  }, [folder.id, engine.unlockedVersion])

  const lista = engine.notesByFolder[folder.id] ?? []

  async function crearNota(titulo: string, contenido: string) {
    if (!titulo.trim() && !contenido.trim()) return
    await engine.addNote(folder.id, titulo, contenido)
    setCreando(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="idea-destino" onClick={() => setCreando((v) => !v)}>
          {creando ? 'Cancelar' : 'Nueva nota'}
        </button>
        <button type="button" className="idea-destino" onClick={() => setMostrarPin((v) => !v)}>
          {mostrarPin ? 'Ocultar PIN' : folder.pinHash !== null ? 'Gestionar PIN' : 'Bloquear con PIN'}
        </button>
      </div>

      {mostrarPin ? <PinManager folder={folder} engine={engine} /> : null}

      {creando ? <NoteForm onGuardar={crearNota} onCancelar={() => setCreando(false)} /> : null}

      {lista.length === 0 && !creando ? (
        <EmptyState title="Ninguna nota todavía." description="Agregá una nota de texto libre en esta carpeta." />
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((nota) => (
            <NoteRow key={nota.id} nota={nota} folder={folder} engine={engine} />
          ))}
        </ul>
      )}
    </div>
  )
}

interface NoteFormProps {
  tituloInicial?: string
  contenidoInicial?: string
  onGuardar: (titulo: string, contenido: string) => void
  onCancelar: () => void
}

function NoteForm({ tituloInicial = '', contenidoInicial = '', onGuardar, onCancelar }: NoteFormProps) {
  const [titulo, setTitulo] = useState(tituloInicial)
  const [contenido, setContenido] = useState(contenidoInicial)

  return (
    <div className="notas-tarjeta flex flex-col gap-2">
      <input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título"
        className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-dim"
      />
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Contenido"
        rows={4}
        className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-dim"
      />
      <div className="flex gap-3">
        <button type="button" className="idea-destino disabled:opacity-40" disabled={!titulo.trim() && !contenido.trim()} onClick={() => onGuardar(titulo, contenido)}>
          Guardar
        </button>
        <button type="button" className="idea-destino" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

interface NoteRowProps {
  nota: NotesNote
  folder: NotesFolder
  engine: NotesEngineApi
}

function NoteRow({ nota, folder, engine }: NoteRowProps) {
  const [interactuando, setInteractuando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  function alternarInteraccion() {
    setInteractuando((actual) => {
      if (actual) {
        setEditando(false)
        setConfirmandoBorrado(false)
      }
      return !actual
    })
  }

  async function guardarEdicion(titulo: string, contenido: string) {
    await engine.updateNote(folder.id, nota.id, { titulo, contenido })
    setEditando(false)
    setInteractuando(false)
  }

  return (
    <li className="notas-tarjeta flex flex-col gap-2">
      {editando ? (
        <NoteForm tituloInicial={nota.titulo} contenidoInicial={nota.contenido} onGuardar={guardarEdicion} onCancelar={() => setEditando(false)} />
      ) : (
        <>
          <button type="button" className="w-full appearance-none border-0 bg-transparent p-0 text-left" onClick={alternarInteraccion} aria-expanded={interactuando}>
            <span className="block text-[15px] text-ink">{nota.titulo || '(sin título)'}</span>
            {nota.contenido ? (
              <span className="mt-1 block max-h-[280px] overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13.5px] text-ink-faint">
                {nota.contenido}
              </span>
            ) : null}
          </button>

          {interactuando ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" className="idea-destino" onClick={() => setEditando(true)}>
                Editar
              </button>
              <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado((v) => !v)}>
                Eliminar
              </button>
            </div>
          ) : null}

          {confirmandoBorrado ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-ink-faint">¿Eliminar nota?</span>
              <button
                type="button"
                className="idea-destino"
                style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }}
                onClick={() => {
                  void engine.deleteNote(folder.id, nota.id)
                  setConfirmandoBorrado(false)
                }}
              >
                Eliminar
              </button>
              <button type="button" className="idea-destino" onClick={() => setConfirmandoBorrado(false)}>
                Cancelar
              </button>
            </div>
          ) : null}
        </>
      )}
    </li>
  )
}

interface PinManagerProps {
  folder: NotesFolder
  engine: NotesEngineApi
}

function PinManager({ folder, engine }: PinManagerProps) {
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinActual, setPinActual] = useState('')
  const [pinNuevo2, setPinNuevo2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false)

  async function bloquear() {
    if (!esPinValido(pinNuevo)) return
    await engine.setPin(folder, pinNuevo)
    setPinNuevo('')
    setOk('Carpeta bloqueada.')
    setError(null)
  }

  async function cambiar() {
    if (!esPinValido(pinActual) || !esPinValido(pinNuevo2)) return
    const cambiado = await engine.changePin(folder, pinActual, pinNuevo2)
    if (!cambiado) {
      setError('El PIN actual no es correcto.')
      setOk(null)
      return
    }
    setPinActual('')
    setPinNuevo2('')
    setError(null)
    setOk('PIN actualizado.')
  }

  async function quitar() {
    await engine.removePin(folder)
    setConfirmandoQuitar(false)
    setOk('Bloqueo eliminado.')
  }

  if (folder.pinHash === null) {
    return (
      <div className="notas-tarjeta flex flex-col gap-2">
        <p className="text-[13px] text-ink-faint">Definí un PIN de 4 dígitos para bloquear esta carpeta.</p>
        <input
          inputMode="numeric"
          maxLength={4}
          value={pinNuevo}
          onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className="w-24 border-b border-border/60 bg-transparent px-1 py-1.5 text-center text-[18px] tracking-[0.3em] text-ink outline-none"
        />
        <button type="button" className="idea-destino self-start disabled:opacity-40" disabled={!esPinValido(pinNuevo)} onClick={bloquear}>
          Bloquear
        </button>
        {ok ? <p className="text-[13px] text-ink-faint">{ok}</p> : null}
      </div>
    )
  }

  return (
    <div className="notas-tarjeta flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] text-ink-faint">Cambiar PIN</p>
        <input
          inputMode="numeric"
          maxLength={4}
          value={pinActual}
          onChange={(e) => setPinActual(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="PIN actual"
          className="w-28 border-b border-border/60 bg-transparent px-1 py-1.5 text-center text-[15px] text-ink outline-none"
        />
        <input
          inputMode="numeric"
          maxLength={4}
          value={pinNuevo2}
          onChange={(e) => setPinNuevo2(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="PIN nuevo"
          className="w-28 border-b border-border/60 bg-transparent px-1 py-1.5 text-center text-[15px] text-ink outline-none"
        />
        <button
          type="button"
          className="idea-destino self-start disabled:opacity-40"
          disabled={!esPinValido(pinActual) || !esPinValido(pinNuevo2)}
          onClick={cambiar}
        >
          Guardar nuevo PIN
        </button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
        {confirmandoQuitar ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-ink-faint">¿Quitar el bloqueo de esta carpeta?</span>
            <button type="button" className="idea-destino" style={{ color: 'var(--critical)', borderColor: 'var(--critical)' }} onClick={quitar}>
              Quitar
            </button>
            <button type="button" className="idea-destino" onClick={() => setConfirmandoQuitar(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="idea-destino self-start" onClick={() => setConfirmandoQuitar(true)}>
            Quitar bloqueo
          </button>
        )}
      </div>

      {error ? <p className="text-[13px]" style={{ color: 'var(--critical)' }}>{error}</p> : null}
      {ok ? <p className="text-[13px] text-ink-faint">{ok}</p> : null}
    </div>
  )
}

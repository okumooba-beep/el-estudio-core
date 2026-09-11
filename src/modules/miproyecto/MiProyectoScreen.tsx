import { useState } from 'react'
import { createNotesEngine } from '@/components/notes-engine/createNotesEngine'
import { NotesEngineScreen } from '@/components/notes-engine/NotesEngineScreen'
import { db } from '@/lib/db/db'

const engine = createNotesEngine(db.miProyectoFolders, db.miProyectoNotes)

export interface MiProyectoScreenProps {
  nombre: string
  onRenombrar: (nombre: string) => Promise<'ok' | 'error'>
}

/**
 * Espacio genérico reutilizable (pedido del sprint: "que cualquier
 * persona pueda crear su propio espacio de trabajo con nombre propio"),
 * mismo motor de carpetas+notas que Notas (ver notes-engine/), sobre su
 * propio par de tablas Dexie/Supabase — nunca mezclado con Notas. El
 * nombre del espacio es una preferencia por usuario (ver
 * src/lib/miproyecto/), pasada como prop desde App.tsx igual que el fondo
 * de la habitación.
 */
export function MiProyectoScreen({ nombre, onRenombrar }: MiProyectoScreenProps) {
  const notes = engine.useEngine()

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 pb-2">
      <NombreEspacio nombre={nombre} onRenombrar={onRenombrar} />
      <NotesEngineScreen
        engine={notes}
        titulo={nombre}
        descripcionVacio="Creá una carpeta para empezar a organizar este espacio."
      />
    </div>
  )
}

interface NombreEspacioProps {
  nombre: string
  onRenombrar: (nombre: string) => Promise<'ok' | 'error'>
}

function NombreEspacio({ nombre, onRenombrar }: NombreEspacioProps) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(nombre)
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'error'>('idle')

  async function guardar() {
    const limpio = valor.trim()
    if (!limpio) return
    setEstado('guardando')
    const resultado = await onRenombrar(limpio)
    if (resultado === 'error') {
      setEstado('error')
      return
    }
    setEstado('idle')
    setEditando(false)
  }

  if (!editando) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-faint">Espacio: {nombre}</p>
        <button
          type="button"
          className="idea-destino shrink-0"
          onClick={() => {
            setValor(nombre)
            setEditando(true)
          }}
        >
          Renombrar espacio
        </button>
      </div>
    )
  }

  return (
    <div className="notas-tarjeta flex flex-col gap-2">
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Nombre del espacio (ej. Omantra, Auto)"
        className="border-b border-border/60 bg-transparent px-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-ink-dim"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void guardar()
        }}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="idea-destino disabled:opacity-40"
          disabled={!valor.trim() || estado === 'guardando'}
          onClick={guardar}
        >
          {estado === 'guardando' ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="idea-destino" onClick={() => setEditando(false)}>
          Cancelar
        </button>
        {estado === 'error' ? <span className="text-[13px]" style={{ color: 'var(--critical)' }}>No se pudo guardar.</span> : null}
      </div>
    </div>
  )
}

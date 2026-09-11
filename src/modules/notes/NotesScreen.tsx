import { createNotesEngine } from '@/components/notes-engine/createNotesEngine'
import { NotesEngineScreen } from '@/components/notes-engine/NotesEngineScreen'
import { db } from '@/lib/db/db'

const engine = createNotesEngine(db.notesFolders, db.notesNotes)

export function NotesScreen() {
  const notes = engine.useEngine()
  return (
    <NotesEngineScreen
      engine={notes}
      titulo="Notas"
      descripcionVacio="Creá una para guardar direcciones, claves o contactos."
    />
  )
}

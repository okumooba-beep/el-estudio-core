import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { NotesFolder, NotesNote } from '@/types/notes'

export interface NotesFolderRepository extends Repository<NotesFolder> {
  add(nombre: string): Promise<NotesFolder>
  update(id: string, patch: Partial<Omit<NotesFolder, 'id' | 'createdAt'>>): Promise<NotesFolder>
  delete(id: string): Promise<void>
}

class DexieNotesFolderRepository implements NotesFolderRepository {
  async list(): Promise<NotesFolder[]> {
    const carpetas = await db.notesFolders.toArray()
    return carpetas.filter((c) => !c.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async add(nombre: string): Promise<NotesFolder> {
    const now = new Date().toISOString()
    const carpeta: NotesFolder = {
      id: generateId(),
      nombre: nombre.trim(),
      pinHash: null,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.notesFolders.add(carpeta)
    return carpeta
  }

  async update(id: string, patch: Partial<Omit<NotesFolder, 'id' | 'createdAt'>>): Promise<NotesFolder> {
    await db.notesFolders.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.notesFolders.get(id)
    if (!updated) throw new Error(`Carpeta ${id} no encontrada`)
    return updated
  }

  /**
   * Borra (soft-delete) la carpeta y todas sus notas — es la única salida
   * documentada si se olvida el PIN. Fase 1 (sync Supabase): tombstone en
   * vez de borrado físico, mismo patrón que financeMovimientos, para que
   * el borrado se propague a Supabase y a otros dispositivos.
   */
  async delete(id: string): Promise<void> {
    const now = new Date().toISOString()
    const notas = await db.notesNotes.where('folderId').equals(id).toArray()
    await Promise.all(
      notas
        .filter((n) => !n.deletedAt)
        .map((n) => db.notesNotes.update(n.id, { deletedAt: now, updatedAt: now, pendingSync: true })),
    )
    await db.notesFolders.update(id, { deletedAt: now, updatedAt: now, pendingSync: true })
  }
}

export interface NotesNoteRepository extends Repository<NotesNote> {
  listByFolder(folderId: string): Promise<NotesNote[]>
  add(input: { folderId: string; titulo: string; contenido: string }): Promise<NotesNote>
  update(id: string, patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>): Promise<NotesNote>
  delete(id: string): Promise<void>
}

class DexieNotesNoteRepository implements NotesNoteRepository {
  async list(): Promise<NotesNote[]> {
    const notas = await db.notesNotes.toArray()
    return notas.filter((n) => !n.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async listByFolder(folderId: string): Promise<NotesNote[]> {
    const notas = await db.notesNotes.where('folderId').equals(folderId).toArray()
    return notas.filter((n) => !n.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: { folderId: string; titulo: string; contenido: string }): Promise<NotesNote> {
    const now = new Date().toISOString()
    const nota: NotesNote = {
      id: generateId(),
      folderId: input.folderId,
      titulo: input.titulo.trim(),
      contenido: input.contenido,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.notesNotes.add(nota)
    return nota
  }

  async update(id: string, patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>): Promise<NotesNote> {
    await db.notesNotes.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.notesNotes.get(id)
    if (!updated) throw new Error(`Nota ${id} no encontrada`)
    return updated
  }

  /** Fase 1 (sync Supabase): soft-delete (tombstone), mismo patrón que financeMovimientos. */
  async delete(id: string): Promise<void> {
    const now = new Date().toISOString()
    await db.notesNotes.update(id, { deletedAt: now, updatedAt: now, pendingSync: true })
  }
}

export const notesFolderRepository: NotesFolderRepository = new DexieNotesFolderRepository()
export const notesNoteRepository: NotesNoteRepository = new DexieNotesNoteRepository()

import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { NotesFolder, NotesNote } from '@/types/notes'
import type { EntityTable } from 'dexie'

/**
 * Motor de carpetas+notas compartido entre `notes/` y `miproyecto/`
 * (ver comentario de cabecera en NotesEngineScreen.tsx) — fábrica en vez
 * de repositorios fijos, para que cada módulo instancie el motor sobre su
 * propio par de tablas Dexie sin duplicar esta lógica de CRUD.
 */
export interface NotesFolderRepository extends Repository<NotesFolder> {
  add(nombre: string): Promise<NotesFolder>
  update(id: string, patch: Partial<Omit<NotesFolder, 'id' | 'createdAt'>>): Promise<NotesFolder>
  delete(id: string): Promise<void>
}

export interface NotesNoteRepository extends Repository<NotesNote> {
  listByFolder(folderId: string): Promise<NotesNote[]>
  add(input: { folderId: string; titulo: string; contenido: string }): Promise<NotesNote>
  update(id: string, patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>): Promise<NotesNote>
  delete(id: string): Promise<void>
}

export interface NotesEngineRepositories {
  folderRepository: NotesFolderRepository
  noteRepository: NotesNoteRepository
}

export function createNotesEngineRepositories(
  folderTable: EntityTable<NotesFolder, 'id'>,
  noteTable: EntityTable<NotesNote, 'id'>,
): NotesEngineRepositories {
  const folderRepository: NotesFolderRepository = {
    async list(): Promise<NotesFolder[]> {
      const carpetas = await folderTable.toArray()
      return carpetas.filter((c) => !c.deletedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    },

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
      await folderTable.add(carpeta)
      return carpeta
    },

    async update(id: string, patch: Partial<Omit<NotesFolder, 'id' | 'createdAt'>>): Promise<NotesFolder> {
      await folderTable.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
      const updated = await folderTable.get(id)
      if (!updated) throw new Error(`Carpeta ${id} no encontrada`)
      return updated
    },

    /** Borra (soft-delete) la carpeta y todas sus notas — tombstone, mismo patrón que financeMovimientos, para propagar el borrado por sync. */
    async delete(id: string): Promise<void> {
      const now = new Date().toISOString()
      const notas = await noteTable.where('folderId').equals(id).toArray()
      await Promise.all(
        notas
          .filter((n) => !n.deletedAt)
          .map((n) => noteTable.update(n.id, { deletedAt: now, updatedAt: now, pendingSync: true })),
      )
      await folderTable.update(id, { deletedAt: now, updatedAt: now, pendingSync: true })
    },
  }

  const noteRepository: NotesNoteRepository = {
    async list(): Promise<NotesNote[]> {
      const notas = await noteTable.toArray()
      return notas.filter((n) => !n.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    async listByFolder(folderId: string): Promise<NotesNote[]> {
      const notas = await noteTable.where('folderId').equals(folderId).toArray()
      return notas.filter((n) => !n.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

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
      await noteTable.add(nota)
      return nota
    },

    async update(id: string, patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>): Promise<NotesNote> {
      await noteTable.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
      const updated = await noteTable.get(id)
      if (!updated) throw new Error(`Nota ${id} no encontrada`)
      return updated
    },

    /** Fase 1 (sync Supabase): soft-delete (tombstone), mismo patrón que financeMovimientos. */
    async delete(id: string): Promise<void> {
      const now = new Date().toISOString()
      await noteTable.update(id, { deletedAt: now, updatedAt: now, pendingSync: true })
    },
  }

  return { folderRepository, noteRepository }
}

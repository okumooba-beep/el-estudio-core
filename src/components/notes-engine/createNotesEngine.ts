import { useEffect, useState } from 'react'
import { createNotesEngineRepositories } from './notesEngineRepository'
import { hashPin } from './pin'
import type { NotesFolder, NotesNote } from '@/types/notes'
import type { EntityTable } from 'dexie'

export interface NotesEngineApi {
  folders: NotesFolder[]
  ready: boolean
  notesByFolder: Record<string, NotesNote[]>
  unlockedVersion: number
  isUnlocked(folder: NotesFolder): boolean
  cargarNotas(folderId: string): Promise<void>
  addFolder(nombre: string): Promise<void>
  renameFolder(id: string, nombre: string): Promise<void>
  deleteFolder(id: string): Promise<void>
  addNote(folderId: string, titulo: string, contenido: string): Promise<void>
  updateNote(folderId: string, id: string, patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>): Promise<void>
  deleteNote(folderId: string, id: string): Promise<void>
  tryUnlock(folder: NotesFolder, pin: string): Promise<boolean>
  setPin(folder: NotesFolder, pin: string): Promise<void>
  changePin(folder: NotesFolder, pinActual: string, pinNuevo: string): Promise<boolean>
  removePin(folder: NotesFolder): Promise<void>
}

/**
 * Fábrica del motor de carpetas+notas (usado por `notes/` y `miproyecto/`,
 * ver NotesEngineScreen.tsx) — cada llamada instancia su propio hook
 * `useEngine` apuntado a un par de tablas Dexie propio, con su propio
 * `sessionUnlocked` (desbloqueo por sesión de la app, no persistido, ver
 * comentario original en el `useNotes` de Notas): dos espacios nunca
 * comparten qué carpetas quedaron desbloqueadas.
 */
export function createNotesEngine(
  folderTable: EntityTable<NotesFolder, 'id'>,
  noteTable: EntityTable<NotesNote, 'id'>,
) {
  const { folderRepository, noteRepository } = createNotesEngineRepositories(folderTable, noteTable)
  const sessionUnlocked = new Set<string>()

  function useEngine(): NotesEngineApi {
    const [folders, setFolders] = useState<NotesFolder[]>([])
    const [ready, setReady] = useState(false)
    const [notesByFolder, setNotesByFolder] = useState<Record<string, NotesNote[]>>({})
    const [unlockedVersion, setUnlockedVersion] = useState(0)

    useEffect(() => {
      folderRepository.list().then((loaded) => {
        setFolders(loaded)
        setReady(true)
      })
    }, [])

    function isUnlocked(folder: NotesFolder): boolean {
      return folder.pinHash === null || sessionUnlocked.has(folder.id)
    }

    async function cargarNotas(folderId: string): Promise<void> {
      const notas = await noteRepository.listByFolder(folderId)
      setNotesByFolder((current) => ({ ...current, [folderId]: notas }))
    }

    async function addFolder(nombre: string): Promise<void> {
      const created = await folderRepository.add(nombre)
      setFolders((current) => [...current, created])
    }

    async function renameFolder(id: string, nombre: string): Promise<void> {
      const updated = await folderRepository.update(id, { nombre })
      setFolders((current) => current.map((f) => (f.id === id ? updated : f)))
    }

    async function deleteFolder(id: string): Promise<void> {
      await folderRepository.delete(id)
      setFolders((current) => current.filter((f) => f.id !== id))
      setNotesByFolder((current) => {
        const { [id]: _omit, ...resto } = current
        return resto
      })
      sessionUnlocked.delete(id)
    }

    async function addNote(folderId: string, titulo: string, contenido: string): Promise<void> {
      const created = await noteRepository.add({ folderId, titulo, contenido })
      setNotesByFolder((current) => ({ ...current, [folderId]: [created, ...(current[folderId] ?? [])] }))
    }

    async function updateNote(
      folderId: string,
      id: string,
      patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>,
    ): Promise<void> {
      const updated = await noteRepository.update(id, patch)
      setNotesByFolder((current) => ({
        ...current,
        [folderId]: (current[folderId] ?? []).map((n) => (n.id === id ? updated : n)),
      }))
    }

    async function deleteNote(folderId: string, id: string): Promise<void> {
      await noteRepository.delete(id)
      setNotesByFolder((current) => ({
        ...current,
        [folderId]: (current[folderId] ?? []).filter((n) => n.id !== id),
      }))
    }

    async function tryUnlock(folder: NotesFolder, pin: string): Promise<boolean> {
      const hash = await hashPin(pin)
      if (hash !== folder.pinHash) return false
      sessionUnlocked.add(folder.id)
      setUnlockedVersion((v) => v + 1)
      return true
    }

    async function setPin(folder: NotesFolder, pin: string): Promise<void> {
      const hash = await hashPin(pin)
      const updated = await folderRepository.update(folder.id, { pinHash: hash })
      setFolders((current) => current.map((f) => (f.id === folder.id ? updated : f)))
      sessionUnlocked.add(folder.id)
    }

    async function changePin(folder: NotesFolder, pinActual: string, pinNuevo: string): Promise<boolean> {
      const hashActual = await hashPin(pinActual)
      if (hashActual !== folder.pinHash) return false
      await setPin(folder, pinNuevo)
      return true
    }

    async function removePin(folder: NotesFolder): Promise<void> {
      const updated = await folderRepository.update(folder.id, { pinHash: null })
      setFolders((current) => current.map((f) => (f.id === folder.id ? updated : f)))
    }

    return {
      folders,
      ready,
      notesByFolder,
      unlockedVersion,
      isUnlocked,
      cargarNotas,
      addFolder,
      renameFolder,
      deleteFolder,
      addNote,
      updateNote,
      deleteNote,
      tryUnlock,
      setPin,
      changePin,
      removePin,
    }
  }

  return { useEngine }
}

export type NotesEngine = ReturnType<typeof createNotesEngine>

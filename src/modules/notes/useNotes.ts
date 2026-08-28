import { useEffect, useState } from 'react'
import { notesFolderRepository, notesNoteRepository } from './notesRepository'
import { hashPin } from './pin'
import type { NotesFolder, NotesNote } from '@/types/notes'

/**
 * Desbloqueo por sesión de la app (pedido explícito del usuario): un
 * Set a nivel de módulo, no `useState` — sobrevive a que el usuario
 * entre y salga de la carpeta mientras la pestaña/PWA sigue abierta,
 * y se resetea solo cuando el módulo se vuelve a cargar (recarga
 * completa de la app), nunca se persiste en Dexie.
 */
const sessionUnlocked = new Set<string>()

export function useNotes() {
  const [folders, setFolders] = useState<NotesFolder[]>([])
  const [ready, setReady] = useState(false)
  const [notesByFolder, setNotesByFolder] = useState<Record<string, NotesNote[]>>({})
  const [unlockedVersion, setUnlockedVersion] = useState(0)

  useEffect(() => {
    notesFolderRepository.list().then((loaded) => {
      setFolders(loaded)
      setReady(true)
    })
  }, [])

  function isUnlocked(folder: NotesFolder): boolean {
    return folder.pinHash === null || sessionUnlocked.has(folder.id)
  }

  async function cargarNotas(folderId: string): Promise<void> {
    const notas = await notesNoteRepository.listByFolder(folderId)
    setNotesByFolder((current) => ({ ...current, [folderId]: notas }))
  }

  async function addFolder(nombre: string): Promise<void> {
    const created = await notesFolderRepository.add(nombre)
    setFolders((current) => [...current, created])
  }

  async function renameFolder(id: string, nombre: string): Promise<void> {
    const updated = await notesFolderRepository.update(id, { nombre })
    setFolders((current) => current.map((f) => (f.id === id ? updated : f)))
  }

  async function deleteFolder(id: string): Promise<void> {
    await notesFolderRepository.delete(id)
    setFolders((current) => current.filter((f) => f.id !== id))
    setNotesByFolder((current) => {
      const { [id]: _omit, ...resto } = current
      return resto
    })
    sessionUnlocked.delete(id)
  }

  async function addNote(folderId: string, titulo: string, contenido: string): Promise<void> {
    const created = await notesNoteRepository.add({ folderId, titulo, contenido })
    setNotesByFolder((current) => ({ ...current, [folderId]: [created, ...(current[folderId] ?? [])] }))
  }

  async function updateNote(folderId: string, id: string, patch: Partial<Pick<NotesNote, 'titulo' | 'contenido'>>): Promise<void> {
    const updated = await notesNoteRepository.update(id, patch)
    setNotesByFolder((current) => ({
      ...current,
      [folderId]: (current[folderId] ?? []).map((n) => (n.id === id ? updated : n)),
    }))
  }

  async function deleteNote(folderId: string, id: string): Promise<void> {
    await notesNoteRepository.delete(id)
    setNotesByFolder((current) => ({
      ...current,
      [folderId]: (current[folderId] ?? []).filter((n) => n.id !== id),
    }))
  }

  /** true si el PIN ingresado es correcto; en ese caso desbloquea la carpeta para el resto de la sesión. */
  async function tryUnlock(folder: NotesFolder, pin: string): Promise<boolean> {
    const hash = await hashPin(pin)
    if (hash !== folder.pinHash) return false
    sessionUnlocked.add(folder.id)
    setUnlockedVersion((v) => v + 1)
    return true
  }

  /** Bloquea la carpeta con un PIN nuevo (carpeta recién creada o sin PIN previo). */
  async function setPin(folder: NotesFolder, pin: string): Promise<void> {
    const hash = await hashPin(pin)
    const updated = await notesFolderRepository.update(folder.id, { pinHash: hash })
    setFolders((current) => current.map((f) => (f.id === folder.id ? updated : f)))
    sessionUnlocked.add(folder.id)
  }

  /** Requiere el PIN actual correcto antes de reemplazarlo. */
  async function changePin(folder: NotesFolder, pinActual: string, pinNuevo: string): Promise<boolean> {
    const hashActual = await hashPin(pinActual)
    if (hashActual !== folder.pinHash) return false
    await setPin(folder, pinNuevo)
    return true
  }

  async function removePin(folder: NotesFolder): Promise<void> {
    const updated = await notesFolderRepository.update(folder.id, { pinHash: null })
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

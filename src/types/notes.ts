/**
 * Módulo Notas — carpetas de texto libre para lo que no es Asunto ni
 * Misión (direcciones, claves, contactos). Dos tablas propias y
 * aisladas (ver db.ts version(19)): ninguna reutiliza `ideas` ni
 * ninguna otra tabla de otro módulo.
 */
export interface NotesFolder {
  id: string
  nombre: string
  /** null si la carpeta nunca se bloqueó, o si se le quitó el bloqueo. */
  pinHash: string | null
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

export interface NotesNote {
  id: string
  folderId: string
  titulo: string
  contenido: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

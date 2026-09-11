import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'

/**
 * Nombre del espacio "Mi proyecto" elegido por el usuario (ej. "Omantra",
 * "Auto") — mismo mecanismo que src/lib/room/roomBackgrounds.ts: cache
 * local instantáneo + reflejo a Supabase (ver miProyectoPrefsClient.ts).
 * Vive en src/lib/ (no en el módulo) por la misma razón que roomBackgrounds:
 * `module-no-app-tree` prohíbe que src/modules importe de src/lib directo
 * salvo las excepciones documentadas en .dependency-cruiser.cjs — App.tsx
 * importa estas funciones y se las pasa a MiProyectoScreen/AjustesScreen
 * como props.
 */
export const NOMBRE_DEFAULT = 'Mi proyecto'

const CLAVE_LOCAL = 'miproyecto.nombre'

export function leerNombreGuardado(): string {
  return readJSON(CLAVE_LOCAL, NOMBRE_DEFAULT)
}

export function guardarNombreLocal(nombre: string): void {
  writeJSON(CLAVE_LOCAL, nombre)
}

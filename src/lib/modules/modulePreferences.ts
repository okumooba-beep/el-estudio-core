import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'

/**
 * Qué Espacios oculta cada usuario de su propia grilla (Ajustes → Módulos).
 * Mismo mecanismo que src/lib/miproyecto/miProyectoPrefs.ts: cache local
 * instantáneo + reflejo a Supabase (ver modulePreferencesClient.ts). Vive en
 * src/lib/ por la misma razón que roomBackgrounds/miProyectoPrefs —
 * `module-no-app-tree`/`today-app-tree-boundaries` prohíben que
 * src/modules/settings o src/modules/today importen de src/lib directo;
 * App.tsx importa estas funciones y pasa los datos como props.
 */
const CLAVE_LOCAL = 'modulos.ocultos'

export function leerOcultosGuardados(): string[] {
  return readJSON(CLAVE_LOCAL, [] as string[])
}

export function guardarOcultosLocal(ocultos: string[]): void {
  writeJSON(CLAVE_LOCAL, ocultos)
}

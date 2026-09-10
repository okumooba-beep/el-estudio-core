import { MODULE as today, ESPACIOS_MODULE } from '@modules/today/public'
import { MODULE as missions } from '@modules/missions/public'
import { MODULE as habits } from '@modules/habits/public'
import { MODULE as finanzas } from '@modules/finance/public'

export interface ModuleDef {
  path: string
  label: string
}

/**
 * Registro de módulos de navegación (F14, ARCHITECTURE_RATIFIED.md
 * roadmap F14): agrega la identidad de cada módulo desde su propio
 * `public.ts` — nunca la declara acá directamente. Ver el Diccionario
 * Oficial.
 *
 * Sprint 030 (§12-16): orden final del nav — Hoy, Misiones, Hábitos,
 * Trading, Finanzas, Espacios. Biblioteca (`frases`) deja el nav directo
 * pero sigue viva en su ruta propia, accesible desde Espacios (ver
 * spaceRegistry.ts) — nunca se elimina el módulo, solo su posición acá.
 * Espacios reemplaza al link aislado que Sprint 029 había agregado a
 * HoyScreen: con Espacios de vuelta en el nav directo, ese link queda
 * redundante y se retira (ver HoyScreen.tsx).
 *
 * Sprint 036: Auditoría deja el nav de primer nivel (7 ítems desbordaban
 * el nav inferior en mobile — el último ítem quedaba fuera del viewport
 * en 390px) y pasa a vivir dentro de Espacios, igual que Agenda/Biblioteca
 * (ver spaceRegistry.ts). El módulo no se elimina, solo su posición acá.
 *
 * Sprint "Nav pill flotante": Trading deja el nav de primer nivel (pasa
 * de 6 a 5 ítems, el nuevo ancho que ocupa cada ítem en la pill flotante
 * no tiene lugar para 6) y pasa a vivir dentro de Espacios, ya registrado
 * ahí desde antes (ver spaceRegistry.ts) — mismo patrón que Auditoría.
 */
export const MODULES: readonly ModuleDef[] = [today, missions, habits, finanzas, ESPACIOS_MODULE]

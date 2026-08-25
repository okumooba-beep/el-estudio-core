import { MODULE as today, ESPACIOS_MODULE } from '@modules/today/public'
import { MODULE as missions } from '@modules/missions/public'
import { MODULE as habits } from '@modules/habits/public'
import { MODULE as trading } from '@modules/trading/public'
import { MODULE as finanzas } from '@modules/finance/public'
import { MODULE as auditoria } from '@modules/auditoria/public'

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
 * Módulo Auditoría: entra al nav de primer nivel junto a Finanzas — es
 * pantalla de uso diario ("sentado en la computadora", §20 del brief),
 * no secundaria como Agenda (que vive dentro de Espacios).
 */
export const MODULES: readonly ModuleDef[] = [today, missions, habits, trading, finanzas, auditoria, ESPACIOS_MODULE]

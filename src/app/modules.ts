import { MODULE as today } from '@modules/today/public'
import { MODULE as missions } from '@modules/missions/public'
import { MODULE as habits } from '@modules/habits/public'
import { MODULE as trading } from '@modules/trading/public'
import { MODULE as frases } from '@modules/frases/public'
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
 * Sprint 029 (§9): Finanzas reemplaza a Espacios como sexto destino
 * directo — Espacios no era un mueble en sí, era la puerta a los que
 * el nav todavía no exponía; con Finanzas ya adentro, esa puerta pierde
 * su lugar en el nav directo (sigue viva en `/espacios`, ver el link
 * agregado a HoyScreen para que no desaparezca del producto).
 */
export const MODULES: readonly ModuleDef[] = [today, missions, habits, trading, frases, finanzas]

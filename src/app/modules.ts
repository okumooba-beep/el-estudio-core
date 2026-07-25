import { MODULE as today } from '@modules/today/public'
import { MODULE as missions } from '@modules/missions/public'
import { MODULE as habits } from '@modules/habits/public'
import { MODULE as trading } from '@modules/trading/public'
import { MODULE as frases } from '@modules/frases/public'

export interface ModuleDef {
  path: string
  label: string
}

/**
 * Registro de módulos de navegación (F14, ARCHITECTURE_RATIFIED.md
 * roadmap F14): agrega la identidad de cada módulo desde su propio
 * `public.ts` — nunca la declara acá directamente. Ver el Diccionario
 * Oficial.
 */
export const MODULES: readonly ModuleDef[] = [today, missions, habits, trading, frases]

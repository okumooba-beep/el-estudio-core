import { MODULE as today, ESPACIOS_MODULE as espacios } from '@modules/today/public'
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
 *
 * Sprint 015.4: `espacios` cierra la lista sin reordenar los cinco que ya
 * estaban — es el acceso a los módulos que el nav todavía no exponía
 * (Cuaderno, Asuntos, Finanzas, Agenda), no un reemplazo de ninguno.
 */
export const MODULES: readonly ModuleDef[] = [today, missions, habits, trading, frases, espacios]

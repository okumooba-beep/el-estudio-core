import { extraerRangoHora } from '@modules/agenda/public'
import type { AgendaBloque } from '@/types/agenda'
import type { AuditConfig } from '@/types/auditoria'
import type { Idea } from '@/types/idea'

/**
 * §8 del brief: "la métrica principal nunca es cuán ocupado estuve — es
 * qué evidencia produjo mi tiempo". Todo acá es planificado-vs-ejecutado
 * sobre Bloques que el usuario protegió a mano (una elección consciente,
 * nunca actividad cruda), o conteo de Misiones — nunca horas totales.
 *
 * Ningún número de este archivo está hardcodeado: los patrones de
 * "evidencia reconocible" (NY SESSION, BACKTESTING...) vienen de
 * `AuditConfig.rutinasReconocidas`, editable por el usuario (§17).
 */
export interface EvidenciaRutina {
  etiqueta: string
  ejecutados: number
  planificados: number
}

export interface EvidenciaSemana {
  porRutina: EvidenciaRutina[]
  horasProtegidas: number
  horasEjecutadas: number
  misionesProgramadas: number
  misionesCompletadas: number
  bloquesOmitidos: number
}

function minutosDesde(horaHHMM: string): number {
  const [horas, minutos] = horaHHMM.split(':')
  return Number(horas ?? 0) * 60 + Number(minutos ?? 0)
}

function duracionMinutos(bloque: AgendaBloque): number {
  const rango = extraerRangoHora(bloque.texto)
  if (!rango) return 0
  const inicio = minutosDesde(rango.inicio)
  let fin = minutosDesde(rango.fin)
  if (fin < inicio) fin += 24 * 60
  return fin - inicio
}

export function calcularEvidencia(
  dias: readonly string[],
  bloques: readonly AgendaBloque[],
  ideas: readonly Idea[],
  config: AuditConfig,
  hoyISO: string,
): EvidenciaSemana {
  const diasSet = new Set(dias)
  const bloquesSemana = bloques.filter((bloque) => diasSet.has(bloque.dia) && !bloque.archivado)
  const protegidos = bloquesSemana.filter((bloque) => bloque.protegido)

  const porRutina: EvidenciaRutina[] = config.rutinasReconocidas.map(({ etiqueta, patron }) => {
    const patronMin = patron.toLowerCase()
    const planificados = protegidos.filter((bloque) => bloque.texto.toLowerCase().includes(patronMin))
    const ejecutados = planificados.filter((bloque) => bloque.completado)
    return { etiqueta, ejecutados: ejecutados.length, planificados: planificados.length }
  })

  const minutosProtegidos = protegidos.reduce((suma, bloque) => suma + duracionMinutos(bloque), 0)
  const minutosEjecutados = protegidos
    .filter((bloque) => bloque.completado)
    .reduce((suma, bloque) => suma + duracionMinutos(bloque), 0)

  const misionesDeLaSemana = ideas.filter(
    (idea) => idea.destino === 'misiones' && idea.programadaFecha && diasSet.has(idea.programadaFecha),
  )
  const misionesCompletadas = misionesDeLaSemana.filter(
    (idea) => idea.estado === 'completada' || idea.estado === 'terminada',
  )
  const bloquesOmitidos = protegidos.filter((bloque) => bloque.dia < hoyISO && !bloque.completado)

  return {
    porRutina,
    horasProtegidas: minutosProtegidos / 60,
    horasEjecutadas: minutosEjecutados / 60,
    misionesProgramadas: misionesDeLaSemana.length,
    misionesCompletadas: misionesCompletadas.length,
    bloquesOmitidos: bloquesOmitidos.length,
  }
}

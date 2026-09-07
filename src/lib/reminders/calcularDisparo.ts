import type { AgendaAviso } from '@/types/agenda'

/**
 * Fase 3 (push real) — minutos de anticipación de cada ventana de aviso
 * (Sprint 012, punto 7: el campo existe desde antes, esta es la primera
 * vez que algo lo consume). 'ninguno' y 'hora' disparan justo a la hora
 * del evento: hoy no hay ningún selector en la UI que distinga los dos
 * (`aviso` siempre nace en '1hora', ver agendaRepository.ts), así que se
 * tratan igual hasta que exista ese control. 'personalizado' tampoco
 * tiene todavía una entrada de minutos propia — se comporta como
 * 'ninguno' hasta que un sprint futuro sume ese input.
 */
const AVISO_MINUTOS: Record<AgendaAviso, number> = {
  ninguno: 0,
  hora: 0,
  '5min': 5,
  '10min': 10,
  '15min': 15,
  '30min': 30,
  '1hora': 60,
  personalizado: 0,
}

export function minutosDeAviso(aviso: AgendaAviso): number {
  return AVISO_MINUTOS[aviso]
}

/**
 * `fecha` en formato YYYY-MM-DD, `hora` en HH:MM. `null` cuando no hay
 * hora cargada — sin hora no existe un instante exacto que calcular
 * (Bloques/Misiones sin hora simplemente no pueden tener alarma).
 */
export function calcularDisparo(fecha: string, hora: string | null, minutosAntes = 0): string | null {
  if (!hora) return null
  const [anio = 0, mes = 1, dia = 1] = fecha.split('-').map(Number)
  const [horas = 0, minutos = 0] = hora.split(':').map(Number)
  const instante = new Date(anio, mes - 1, dia, horas, minutos)
  instante.setMinutes(instante.getMinutes() - minutosAntes)
  return instante.toISOString()
}

import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { AuditRuptura, AuditPremortem, AuditCorreccionSemanal, AuditConfig, RupturaTipo } from '@/types/auditoria'

/**
 * Mismo patrón que financeRepository.ts / agendaRepository.ts: una tabla
 * Dexie por entidad, mismo contrato Repository<T> (list), add/update con
 * la forma real de cada una.
 */
export interface NuevaAuditRuptura {
  fecha: string
  texto: string
  tipo: RupturaTipo
  origenId?: string
}

export interface AuditRupturaRepository extends Repository<AuditRuptura> {
  add(input: NuevaAuditRuptura): Promise<AuditRuptura>
}

class DexieAuditRupturaRepository implements AuditRupturaRepository {
  async list(): Promise<AuditRuptura[]> {
    const rupturas = await db.auditRupturas.toArray()
    return rupturas.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevaAuditRuptura): Promise<AuditRuptura> {
    const now = new Date().toISOString()
    const ruptura: AuditRuptura = {
      id: generateId(),
      fecha: input.fecha,
      texto: input.texto.trim(),
      tipo: input.tipo,
      ...(input.origenId ? { origenId: input.origenId } : {}),
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.auditRupturas.add(ruptura)
    return ruptura
  }
}

export interface NuevoAuditPremortem {
  semanaId: string
  patron: string
  primeraSeñal: string
  cuando: string
  respuesta: string
}

export interface AuditPremortemRepository extends Repository<AuditPremortem> {
  add(input: NuevoAuditPremortem): Promise<AuditPremortem>
  update(id: string, patch: Partial<Omit<AuditPremortem, 'id' | 'createdAt'>>): Promise<AuditPremortem>
  delete(id: string): Promise<void>
}

class DexieAuditPremortemRepository implements AuditPremortemRepository {
  async list(): Promise<AuditPremortem[]> {
    const premortems = await db.auditPremortems.toArray()
    return premortems.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevoAuditPremortem): Promise<AuditPremortem> {
    const now = new Date().toISOString()
    const premortem: AuditPremortem = {
      id: generateId(),
      semanaId: input.semanaId,
      patron: input.patron.trim(),
      primeraSeñal: input.primeraSeñal.trim(),
      cuando: input.cuando.trim(),
      respuesta: input.respuesta.trim(),
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.auditPremortems.add(premortem)
    return premortem
  }

  async update(id: string, patch: Partial<Omit<AuditPremortem, 'id' | 'createdAt'>>): Promise<AuditPremortem> {
    await db.auditPremortems.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.auditPremortems.get(id)
    if (!updated) throw new Error(`Premortem ${id} no encontrado`)
    return updated
  }

  async delete(id: string): Promise<void> {
    await db.auditPremortems.delete(id)
  }
}

export type CorreccionSemanalInput = Omit<
  AuditCorreccionSemanal,
  'id' | 'semanaId' | 'bloqueCreadoId' | 'createdAt' | 'updatedAt' | 'pendingSync'
>

export interface AuditCorreccionRepository extends Repository<AuditCorreccionSemanal> {
  /**
   * Una fila por semana: si ya existe una corrección para `semanaId` la
   * actualiza en su lugar, si no la crea — nunca dos filas para la misma
   * semana (§13 del brief: la corrección de una semana es una sola).
   */
  upsert(semanaId: string, input: CorreccionSemanalInput): Promise<AuditCorreccionSemanal>
  /** Se llama después de crear el AgendaBloque real vía `crearBloqueDesdeCorreccion` (agenda/public.ts). */
  marcarAplicada(id: string, bloqueCreadoId: string): Promise<AuditCorreccionSemanal>
}

class DexieAuditCorreccionRepository implements AuditCorreccionRepository {
  async list(): Promise<AuditCorreccionSemanal[]> {
    const correcciones = await db.auditCorrecciones.toArray()
    return correcciones.sort((a, b) => b.semanaId.localeCompare(a.semanaId))
  }

  async upsert(semanaId: string, input: CorreccionSemanalInput): Promise<AuditCorreccionSemanal> {
    const now = new Date().toISOString()
    const existente = await db.auditCorrecciones.where('semanaId').equals(semanaId).first()
    if (existente) {
      await db.auditCorrecciones.update(existente.id, { ...input, updatedAt: now, pendingSync: true })
      const updated = await db.auditCorrecciones.get(existente.id)
      if (!updated) throw new Error(`Corrección ${existente.id} no encontrada`)
      return updated
    }
    const corregida: AuditCorreccionSemanal = {
      id: generateId(),
      semanaId,
      ...input,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.auditCorrecciones.add(corregida)
    return corregida
  }

  async marcarAplicada(id: string, bloqueCreadoId: string): Promise<AuditCorreccionSemanal> {
    await db.auditCorrecciones.update(id, { bloqueCreadoId, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.auditCorrecciones.get(id)
    if (!updated) throw new Error(`Corrección ${id} no encontrada`)
    return updated
  }
}

const CONFIG_ID = 'config' as const

const CONFIG_DEFAULT: Omit<AuditConfig, 'createdAt' | 'updatedAt' | 'pendingSync'> = {
  id: CONFIG_ID,
  resultadoDominante: 'Construir evidencia de mi sistema de trading',
  /**
   * Semillas basadas en la rutina real descripta en el brief (§17):
   * sesión NY, backtesting nocturno, registro posterior. Editables desde
   * la UI — nunca hardcodeadas en evidencia.ts (ver auditoria/evidencia.ts).
   */
  rutinasReconocidas: [
    { etiqueta: 'NY SESSION', patron: 'sesión ny' },
    { etiqueta: 'BACKTESTING', patron: 'backtesting' },
    { etiqueta: 'REGISTROS', patron: 'registro' },
  ],
  señalRoja: {
    condicion: 'Procrastinación o más de 1h45 de consumo pasivo de redes sociales',
    respuesta: 'Cortar la conducta, retirar el teléfono, elegir una sola tarea, ejecutar 30 minutos, volver al sistema, no compensar después.',
  },
}

export interface AuditConfigRepository {
  /** Crea la fila con los defaults la primera vez que se pide — nunca hay "sin config", solo config sin editar. */
  get(): Promise<AuditConfig>
  update(patch: Partial<Omit<AuditConfig, 'id' | 'createdAt'>>): Promise<AuditConfig>
}

class DexieAuditConfigRepository implements AuditConfigRepository {
  async get(): Promise<AuditConfig> {
    const existente = await db.auditConfig.get(CONFIG_ID)
    if (existente) return existente
    const now = new Date().toISOString()
    const config: AuditConfig = { ...CONFIG_DEFAULT, createdAt: now, updatedAt: now, pendingSync: true }
    /**
     * `put`, no `add`: React StrictMode monta el efecto de useAuditoria dos
     * veces en dev, así que dos llamadas a `get()` pueden correr en paralelo
     * y ambas ver "no existe fila todavía". Con `add` la segunda tira
     * ConstraintError (misma key); con `put` la segunda simplemente
     * sobreescribe con el mismo default — inofensivo, nunca pisa datos
     * reales porque el único contenido posible acá es CONFIG_DEFAULT.
     */
    await db.auditConfig.put(config)
    return config
  }

  async update(patch: Partial<Omit<AuditConfig, 'id' | 'createdAt'>>): Promise<AuditConfig> {
    const actual = await this.get()
    const actualizada: AuditConfig = { ...actual, ...patch, updatedAt: new Date().toISOString(), pendingSync: true }
    await db.auditConfig.put(actualizada)
    return actualizada
  }
}

export const auditRupturaRepository: AuditRupturaRepository = new DexieAuditRupturaRepository()
export const auditPremortemRepository: AuditPremortemRepository = new DexieAuditPremortemRepository()
export const auditCorreccionRepository: AuditCorreccionRepository = new DexieAuditCorreccionRepository()
export const auditConfigRepository: AuditConfigRepository = new DexieAuditConfigRepository()

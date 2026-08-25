import { useEffect, useState } from 'react'
import {
  auditRupturaRepository,
  auditPremortemRepository,
  auditCorreccionRepository,
  auditConfigRepository,
  type NuevaAuditRuptura,
  type NuevoAuditPremortem,
  type CorreccionSemanalInput,
} from './auditoriaRepository'
import type { AuditRuptura, AuditPremortem, AuditCorreccionSemanal, AuditConfig } from '@/types/auditoria'

/** Mismo patrón que useFinance/useAgenda: carga una vez al montar, cada escritura actualiza el estado local y persiste en paralelo. */
export function useAuditoria() {
  const [rupturas, setRupturas] = useState<AuditRuptura[]>([])
  const [premortems, setPremortems] = useState<AuditPremortem[]>([])
  const [correcciones, setCorrecciones] = useState<AuditCorreccionSemanal[]>([])
  const [config, setConfig] = useState<AuditConfig | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      auditRupturaRepository.list(),
      auditPremortemRepository.list(),
      auditCorreccionRepository.list(),
      auditConfigRepository.get(),
    ]).then(([loadedRupturas, loadedPremortems, loadedCorrecciones, loadedConfig]) => {
      setRupturas(loadedRupturas)
      setPremortems(loadedPremortems)
      setCorrecciones(loadedCorrecciones)
      setConfig(loadedConfig)
      setReady(true)
    })
  }, [])

  async function addRuptura(input: NuevaAuditRuptura): Promise<void> {
    const created = await auditRupturaRepository.add(input)
    setRupturas((current) => [created, ...current])
  }

  async function addPremortem(input: NuevoAuditPremortem): Promise<void> {
    const created = await auditPremortemRepository.add(input)
    setPremortems((current) => [created, ...current])
  }

  async function updatePremortem(id: string, patch: Partial<Omit<AuditPremortem, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await auditPremortemRepository.update(id, patch)
    setPremortems((current) => current.map((premortem) => (premortem.id === id ? updated : premortem)))
  }

  async function deletePremortem(id: string): Promise<void> {
    await auditPremortemRepository.delete(id)
    setPremortems((current) => current.filter((premortem) => premortem.id !== id))
  }

  async function guardarCorreccion(semanaId: string, input: CorreccionSemanalInput): Promise<AuditCorreccionSemanal> {
    const guardada = await auditCorreccionRepository.upsert(semanaId, input)
    setCorrecciones((current) => [guardada, ...current.filter((corr) => corr.id !== guardada.id)])
    return guardada
  }

  async function marcarCorreccionAplicada(id: string, bloqueCreadoId: string): Promise<void> {
    const updated = await auditCorreccionRepository.marcarAplicada(id, bloqueCreadoId)
    setCorrecciones((current) => current.map((corr) => (corr.id === id ? updated : corr)))
  }

  async function updateConfig(patch: Partial<Omit<AuditConfig, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await auditConfigRepository.update(patch)
    setConfig(updated)
  }

  return {
    rupturas,
    premortems,
    correcciones,
    config,
    ready,
    addRuptura,
    addPremortem,
    updatePremortem,
    deletePremortem,
    guardarCorreccion,
    marcarCorreccionAplicada,
    updateConfig,
  }
}

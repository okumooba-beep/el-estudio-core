import { useEffect, useState } from 'react'
import {
  agendaEventoRepository,
  agendaBloqueRepository,
  type NuevoAgendaEvento,
  type NuevoAgendaBloque,
} from './agendaRepository'
import type { AgendaEvento, AgendaBloque } from '@/types/agenda'

/** Mismo patrón que useFinance: carga una vez al montar, cada escritura actualiza el estado local y persiste en paralelo. */
export function useAgenda() {
  const [eventos, setEventos] = useState<AgendaEvento[]>([])
  const [bloques, setBloques] = useState<AgendaBloque[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([agendaEventoRepository.list(), agendaBloqueRepository.list()]).then(
      ([loadedEventos, loadedBloques]) => {
        setEventos(loadedEventos)
        setBloques(loadedBloques)
        setReady(true)
      },
    )
  }, [])

  async function addEvento(input: NuevoAgendaEvento): Promise<void> {
    const created = await agendaEventoRepository.add(input)
    setEventos((current) => [created, ...current])
  }

  async function updateEvento(id: string, patch: Partial<Omit<AgendaEvento, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await agendaEventoRepository.update(id, patch)
    setEventos((current) => current.map((evento) => (evento.id === id ? updated : evento)))
  }

  async function addBloque(input: NuevoAgendaBloque): Promise<void> {
    const created = await agendaBloqueRepository.add(input)
    setBloques((current) => [created, ...current])
  }

  async function updateBloque(id: string, patch: Partial<Omit<AgendaBloque, 'id' | 'createdAt'>>): Promise<void> {
    const updated = await agendaBloqueRepository.update(id, patch)
    setBloques((current) => current.map((bloque) => (bloque.id === id ? updated : bloque)))
  }

  return { eventos, bloques, ready, addEvento, updateEvento, addBloque, updateBloque }
}

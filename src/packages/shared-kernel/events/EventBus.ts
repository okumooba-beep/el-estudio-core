type Listener<Payload> = (payload: Payload) => void

/**
 * Bus tipado en memoria (F6, ARCHITECTURE_RATIFIED.md §9): entrega
 * síncrona, dentro del proceso, sin persistencia, sin garantía de
 * replay, sin entrega entre pestañas/dispositivos. Los suscriptores se
 * notifican en el mismo orden en que se registraron. No es event
 * sourcing: emitir sin suscriptores no deja rastro.
 */
export class EventBus<EventMap extends object> {
  private readonly listeners: { [K in keyof EventMap]?: Listener<EventMap[K]>[] } = {}

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): () => void {
    const forEvent = (this.listeners[event] ??= [])
    forEvent.push(listener)
    return () => {
      const index = forEvent.indexOf(listener)
      if (index !== -1) forEvent.splice(index, 1)
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const forEvent = this.listeners[event]
    if (!forEvent) return
    for (const listener of [...forEvent]) listener(payload)
  }
}

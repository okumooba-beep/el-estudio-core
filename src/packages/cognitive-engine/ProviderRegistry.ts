import type { ClassificationEngine } from './ports/ClassificationEngine'

/**
 * F7 (ARCHITECTURE_RATIFIED.md §4): quién decide qué proveedor está
 * activo es una decisión de composición, nunca del motor mismo. Este
 * registro no lee configuración por su cuenta ni desde ningún lado —
 * `app/shell` es quien registra proveedores y selecciona uno, en el
 * momento de composición, nunca cognitive-engine leyéndose a sí mismo.
 */
export class ProviderRegistry<TDestino extends string> {
  private readonly providers = new Map<string, ClassificationEngine<TDestino>>()
  private activeId: string | null = null

  register(id: string, provider: ClassificationEngine<TDestino>): void {
    this.providers.set(id, provider)
  }

  select(id: string): void {
    if (!this.providers.has(id)) throw new Error(`Proveedor de clasificación "${id}" no registrado`)
    this.activeId = id
  }

  getActive(): ClassificationEngine<TDestino> {
    if (!this.activeId) throw new Error('Ningún proveedor de clasificación seleccionado')
    const provider = this.providers.get(this.activeId)
    if (!provider) throw new Error(`Proveedor de clasificación "${this.activeId}" no registrado`)
    return provider
  }
}

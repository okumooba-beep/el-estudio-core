import { ProviderRegistry } from '@cognitive-engine/ProviderRegistry'
import { RuleBasedClassifier } from '@cognitive-engine/providers/rule-based/RuleBasedClassifier'
import type { Destino } from '@cognitive-engine/providers/rule-based/rules'

/**
 * F7 (ARCHITECTURE_RATIFIED.md §4): la selección de proveedor es una
 * decisión de composición de app/shell, nunca algo que cognitive-engine
 * decide por su cuenta. Hoy solo existe 'rule-based'; agregar un
 * proveedor nuevo es registrarlo acá, nunca tocar el motor.
 */
const registry = new ProviderRegistry<Destino>()
registry.register('rule-based', new RuleBasedClassifier())
registry.select('rule-based')

export const comprehensionEngine = registry.getActive()

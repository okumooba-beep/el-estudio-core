import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import { generateId } from '@shared-kernel/id'
import { DEFAULT_TRADING_CHECKLIST } from './defaultTradingChecklist'
import type { ChecklistItem } from '@/types/operacion'

const TEMPLATE_KEY = 'trading-checklist-template'

export type ChecklistTemplateItem = Omit<ChecklistItem, 'checked'>

export function getChecklistTemplate(): ChecklistTemplateItem[] {
  return readJSON<ChecklistTemplateItem[]>(TEMPLATE_KEY, [...DEFAULT_TRADING_CHECKLIST])
}

export function saveChecklistTemplate(items: readonly ChecklistTemplateItem[]): void {
  writeJSON(TEMPLATE_KEY, items)
}

export function newTemplateItem(): ChecklistTemplateItem {
  return { id: generateId(), texto: '' }
}

/** Cada operación copia la plantilla al nacer (Sprint 3.6.1, parte 5) — nunca comparte referencia. */
export function buildChecklistFromTemplate(): ChecklistItem[] {
  return getChecklistTemplate().map((item) => ({ ...item, checked: false }))
}

import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { HabitCheck } from '@/types/habitCheck'

export interface HabitCheckRepository extends Repository<HabitCheck> {
  setChecked(habitId: string, fecha: string, checked: boolean): Promise<HabitCheck>
}

class DexieHabitCheckRepository implements HabitCheckRepository {
  async list(): Promise<HabitCheck[]> {
    return db.habitChecks.toArray()
  }

  async setChecked(habitId: string, fecha: string, checked: boolean): Promise<HabitCheck> {
    const updatedAt = new Date().toISOString()
    const existing = await db.habitChecks.where({ habitId, fecha }).first()
    if (existing) {
      await db.habitChecks.update(existing.id, { checked, updatedAt, pendingSync: true })
      return { ...existing, checked, updatedAt, pendingSync: true }
    }
    const check: HabitCheck = { id: generateId(), habitId, fecha, checked, updatedAt, pendingSync: true }
    await db.habitChecks.add(check)
    return check
  }
}

export const habitCheckRepository: HabitCheckRepository = new DexieHabitCheckRepository()

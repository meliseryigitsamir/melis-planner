import type { Task, CheckIn } from './types'
import { ROLE_CATS } from './constants'
import { todayStr, addDays, isPast } from './utils'

export function filterByRoleEnergy(tasks: Task[], checkin: CheckIn | null): Task[] {
  if (!checkin) return tasks

  // Role filter
  const cats = ROLE_CATS[checkin.role]
  let filtered = cats
    ? tasks.filter(t => !t.cat || cats.some(c => t.cat?.includes(c.split(' ')[0])))
    : tasks

  // Energy filter — never remove done tasks (they need to show as completed)
  const today = todayStr()
  if (checkin.energy === 'low') {
    return filtered.filter(t =>
      t.done || (isPast(t.date) || t.priority === 'high')
    )
  }
  if (checkin.energy === 'mid') {
    return filtered.filter(t =>
      t.done || (!t.date || t.date <= addDays(1) || t.priority === 'high')
    )
  }
  return filtered
}

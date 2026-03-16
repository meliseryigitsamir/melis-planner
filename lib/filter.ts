import type { Task, CheckIn, ClientEntry, Pool } from './types'
import { ROLE_CATS } from './constants'
import { todayStr, addDays, isPast } from './utils'

/** Role filter — keeps tasks whose category matches the role's allowed cats */
function filterByRole(tasks: Task[], checkin: CheckIn | null): Task[] {
  if (!checkin) return tasks
  const cats = ROLE_CATS[checkin.role]
  return cats
    ? tasks.filter(t => !t.cat || cats.some(c => t.cat?.includes(c.split(' ')[0])))
    : tasks
}

/** Energy filter — never removes done tasks */
function filterByEnergy(tasks: Task[], checkin: CheckIn | null): Task[] {
  if (!checkin) return tasks
  if (checkin.energy === 'low') {
    return tasks.filter(t =>
      t.done || (isPast(t.date) || t.priority === 'high')
    )
  }
  if (checkin.energy === 'mid') {
    return tasks.filter(t =>
      t.done || (!t.date || t.date <= addDays(1) || t.priority === 'high')
    )
  }
  return tasks
}

/** Hat (pool) filter */
function filterByHat(tasks: Task[], hat: 'all' | Pool): Task[] {
  return hat === 'all' ? tasks : tasks.filter(t => t.pool === hat)
}

/** Legacy: role + energy filter (no backlog) — used for backward compat */
export function filterByRoleEnergy(tasks: Task[], checkin: CheckIn | null): Task[] {
  return filterByEnergy(filterByRole(tasks, checkin), checkin)
}

/** Unified context filter: role → energy → hat, works for ALL task types */
export function contextFilter(tasks: Task[], checkin: CheckIn | null, hat: 'all' | Pool): Task[] {
  return filterByHat(filterByEnergy(filterByRole(tasks, checkin), checkin), hat)
}

/** Filter clients by role — hides irrelevant clients based on role categories */
export function filterClientsByRole(clients: ClientEntry[], checkin: CheckIn | null): ClientEntry[] {
  if (!checkin) return clients
  const cats = ROLE_CATS[checkin.role]
  return cats
    ? clients.filter(c => cats.some(cat => c.cat.includes(cat.split(' ')[0])))
    : clients
}

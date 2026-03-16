import type { PlannerState, CheckIn, CheckInHistory } from './types'
import { SEED_DATA } from './seedData'
import { todayStr } from './utils'

const SK = 'melis_planner_2026_v5'
const CI_SK = 'melis_ci_v1'
const CI_HIST_SK = 'melis_ci_history'

const EMPTY_STATE: PlannerState = {
  tasks: [],
  notes: { aile: [], is: [] },
  ideas: [],
  reminders: [],
  completed: [],
  clients: [],
  customCats: [],
}

// ── PLANNER STATE ────────────────────────────────────────
export function loadState(): PlannerState {
  if (typeof window === 'undefined') return EMPTY_STATE
  try {
    const raw = localStorage.getItem(SK)
    if (!raw) {
      // First time — seed with all data
      const seeded = SEED_DATA
      localStorage.setItem(SK, JSON.stringify({ ...seeded, v: 5 }))
      return seeded
    }
    const parsed = JSON.parse(raw) as Partial<PlannerState>
    const tasks = parsed.tasks ?? []
    // If stored data has no tasks, re-seed
    if (tasks.length === 0) {
      const seeded = SEED_DATA
      localStorage.setItem(SK, JSON.stringify({ ...seeded, v: 5 }))
      return seeded
    }
    return {
      tasks,
      notes:      parsed.notes      ?? { aile: [], is: [] },
      ideas:      parsed.ideas      ?? [],
      reminders:  parsed.reminders  ?? [],
      completed:  parsed.completed  ?? [],
      clients:    parsed.clients    ?? SEED_DATA.clients ?? [],
      customCats: (parsed as any).customCats ?? [],
    }
  } catch {
    return SEED_DATA
  }
}

export function saveState(state: PlannerState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SK, JSON.stringify({ ...state, v: 5 }))
  } catch {
    // storage full — silent fail
  }
}

export function exportJSON(state: PlannerState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `melis_planner_${new Date().toISOString().split('T')[0]}.json`
  a.click()
}

export function importJSON(onLoad: (state: PlannerState) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Partial<PlannerState>
        const imported: PlannerState = {
          tasks:      parsed.tasks      ?? [],
          notes:      parsed.notes      ?? { aile: [], is: [] },
          ideas:      parsed.ideas      ?? [],
          reminders:  parsed.reminders  ?? [],
          completed:  parsed.completed  ?? [],
          clients:    parsed.clients    ?? [],
          customCats: (parsed as any).customCats ?? [],
        }
        onLoad(imported)
      } catch {
        alert('Dosya okunamadı — geçerli bir JSON dosyası seçin.')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// ── CHECK-IN ─────────────────────────────────────────────
export function loadCheckIn(): CheckIn | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CI_SK)
    if (!raw) return null
    const ci = JSON.parse(raw) as CheckIn
    const today = todayStr()
    return ci.date === today ? ci : null
  } catch {
    return null
  }
}

export function saveCheckIn(ci: CheckIn): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CI_SK, JSON.stringify(ci))
    // Append to history
    const raw = localStorage.getItem(CI_HIST_SK)
    const hist: CheckInHistory[] = raw ? JSON.parse(raw) : []
    const filtered = hist.filter(h => h.date !== ci.date)
    filtered.push(ci)
    if (filtered.length > 60) filtered.splice(0, filtered.length - 60)
    localStorage.setItem(CI_HIST_SK, JSON.stringify(filtered))
  } catch { /* noop */ }
}

export function loadCheckInHistory(): CheckInHistory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CI_HIST_SK)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

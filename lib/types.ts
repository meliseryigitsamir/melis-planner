// ── CORE TYPES ───────────────────────────────────────────

export type Pool = 'aile' | 'is'
export type TaskType = 'task' | 'backlog' | 'weekly'
export type Priority = 'high' | 'med' | ''
export type Role = 'anne' | 'akademi' | 'girisim' | 'hepsi'
export type Energy = 'high' | 'mid' | 'low'
export type NoteType = 'aksiyon' | 'fikir' | 'takip'
export type View = 'today' | 'all' | 'pool' | 'notes' | 'cats' | 'pipeline'
export type NudgeVariant = 'warn' | 'info' | 'danger'
export type PipelineStage = 'lead' | 'teklif' | 'aktif' | 'tamamlandi'

export interface Task {
  id: number
  title: string
  date: string | null
  cat: string
  pool: Pool
  type: TaskType
  priority: Priority
  done: boolean
}

export interface Note {
  id: number
  t: string
  c: string
  pool: Pool
  createdAt: string
  taskId: number | null
}

export interface Idea {
  id: number
  t: string
  c: string
  createdAt: string
}

export interface Reminder {
  id: number
  t: string
  c: string
  createdAt: string
}

export interface CheckIn {
  date: string
  role: Role
  energy: Energy
}

export interface CheckInHistory {
  date: string
  role: Role
  energy: Energy
}

// ── CLIENT / PIPELINE ────────────────────────────────────

export interface ClientEntry {
  id: number
  name: string
  cat: string          // which category (e.g. 'Lâl Project', 'YZTD')
  stage: PipelineStage
  notes: string
  pool: Pool
  createdAt: string
}

export interface CustomCat {
  n: string
  c: string
  pool: Pool
}

export interface PlannerState {
  tasks: Task[]
  notes: { aile: Note[]; is: Note[] }
  ideas: Idea[]
  reminders: Reminder[]
  completed: { title: string; doneAt: string; role?: Role }[]
  clients: ClientEntry[]
  customCats: CustomCat[]
}

export interface Nudge {
  type: NudgeVariant
  icon: string
  label: string
  text: string
}

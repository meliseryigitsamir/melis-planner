'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { usePlanner } from '@/hooks/usePlanner'
import CheckInScreen from '@/components/CheckIn'
import TaskCard from '@/components/TaskCard'
import TaskModal from '@/components/TaskModal'
import NudgeCard from '@/components/NudgeCard'
import DistChart from '@/components/DistChart'
import SmartNotes from '@/components/SmartNotes'
import { filterByRoleEnergy, contextFilter, filterClientsByRole } from '@/lib/filter'
import { getNudges } from '@/lib/nudges'
import { urgencyScore, todayStr, addDays, isPast, detectPool, detectCat, dateToLocalStr } from '@/lib/utils'
import { ROLES, ENERGIES, MONTHS, DAYS_TR, DAYS_S, ALL_CATS, CATS_W, CATS_P, PIPELINE_STAGES } from '@/lib/constants'
import { exportJSON } from '@/lib/storage'
import type { Task, View, PipelineStage, ClientEntry, CustomCat } from '@/lib/types'

export default function PlannerPage() {
  const {
    state, checkin, hydrated, hat, setHat,
    addTask, toggleTask, updateTask, deleteTask,
    addClient, updateClient, deleteClient,
    addCustomCat, deleteCustomCat,
    addSmartNote, ideaToTask, deleteIdea, deleteReminder,
    doCheckIn, resetCheckIn,
  } = usePlanner()

  const [view, setView] = useState<View>('today')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [stripSel, setStripSel] = useState<string | null>(null)
  const [qaVal, setQaVal] = useState('')
  const [qaMode, setQaMode] = useState<'today' | 'tomorrow' | 'pool'>('today')
  const [qaPool, setQaPool] = useState<'aile' | 'is'>('aile')
  const [weekOffset, setWeekOffset] = useState(0)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientCat, setNewClientCat] = useState('Lâl Project')
  const [newClientStage, setNewClientStage] = useState<PipelineStage>('lead')
  const [newClientNotes, setNewClientNotes] = useState('')
  const [editingClient, setEditingClient] = useState<ClientEntry | null>(null)
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null)
  const tasksRef = useRef<HTMLDivElement>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')
  const [newCatPool, setNewCatPool] = useState<'aile' | 'is'>('is')

  const [toast, setToast] = useState<string | null>(null)

  // ── CHECK-IN CASCADING DEFAULTS ──────────────────────
  useEffect(() => {
    if (!checkin) return
    if (checkin.role === 'anne') { setHat('aile'); setQaPool('aile') }
    else if (checkin.role === 'akademi' || checkin.role === 'girisim') { setHat('is'); setQaPool('is') }
    else { setHat('all') }
  }, [checkin?.role, checkin?.date])

  // ── LIVE CLOCK (updates every 30s) ──────────────────
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const d = now ?? new Date()
  const today = todayStr()
  const clients = state.clients ?? []
  const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  // ── SHARE ALL TODAY'S TASKS ─────────────────────────
  const buildDaySummary = (targetDate?: string) => {
    const dt = targetDate ?? today
    const dd = new Date(dt + 'T00:00:00')
    const dayLabel = `${DAYS_TR[dd.getDay()]}, ${dd.getDate()} ${MONTHS[dd.getMonth()]} ${dd.getFullYear()}`
    const dayTasks = state.tasks.filter(t => t.date === dt)
    const undone = dayTasks.filter(t => !t.done)
    const done = dayTasks.filter(t => t.done)
    const hr = d.getHours()
    const greet = hr < 12 ? '☀️' : hr < 18 ? '🌤️' : '🌙'

    let text = `${greet} Melis Planner — ${dayLabel}\n⏰ ${timeStr}\n\n`

    if (undone.length > 0) {
      text += `📋 Yapılacaklar (${undone.length}):\n`
      undone.forEach((t, i) => {
        const pool = t.pool === 'aile' ? '👩‍👧' : '💼'
        const priority = t.priority === 'high' ? ' 🔴' : ''
        text += `${i + 1}. ${pool} ${t.title}${priority}${t.cat ? ` [${t.cat}]` : ''}\n`
      })
    }

    if (done.length > 0) {
      text += `\n✅ Tamamlanan (${done.length}):\n`
      done.forEach((t, i) => {
        text += `${i + 1}. ✓ ${t.title}\n`
      })
    }

    const pct = dayTasks.length > 0 ? Math.round(done.length / dayTasks.length * 100) : 0
    text += `\n📊 İlerleme: %${pct} (${done.length}/${dayTasks.length})`

    return text
  }

  const shareDayWhatsApp = () => {
    const text = buildDaySummary()
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    setShowShareMenu(false)
  }

  const shareDayCopy = () => {
    const text = buildDaySummary()
    navigator.clipboard.writeText(text)
    setShareMsg('✅ Kopyalandı!')
    setTimeout(() => setShareMsg(''), 2000)
    setShowShareMenu(false)
  }

  const shareDaySMS = () => {
    const text = buildDaySummary()
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
    setShowShareMenu(false)
  }

  // ── DERIVED DATA (Unified Context Filter) ─────────────
  const contextTasks = useMemo(
    () => contextFilter(state.tasks, checkin, hat),
    [state.tasks, checkin, hat]
  )
  const filtered = useMemo(
    () => contextTasks.filter(t => t.type !== 'backlog'),
    [contextTasks]
  )
  const hatFiltered = filtered
  const roleClients = useMemo(
    () => filterClientsByRole(clients, checkin),
    [clients, checkin]
  )

  const overdue     = hatFiltered.filter(t => !t.done && t.date && isPast(t.date))
  const todayUndone = hatFiltered.filter(t => !t.done && t.date === today)
  const todayDone   = hatFiltered.filter(t => t.done && t.date === today)
  const tomorrow    = hatFiltered.filter(t => !t.done && t.date === addDays(1))
  const thisWeek    = hatFiltered.filter(t => !t.done && t.date && t.date > addDays(1) && t.date <= addDays(7))
    .sort((a, b) => a.date!.localeCompare(b.date!))

  const urgentSet = new Set<number>()
  const urgentList: Task[] = []
  ;[...overdue, ...todayUndone.filter(t => t.priority === 'high')].forEach(t => {
    if (!urgentSet.has(t.id)) { urgentSet.add(t.id); urgentList.push(t) }
  })
  urgentList.sort((a, b) => urgencyScore(b) - urgencyScore(a))
  const normalToday = todayUndone.filter(t => !urgentSet.has(t.id))
    .sort((a, b) => urgencyScore(b) - urgencyScore(a))

  const allToday = state.tasks.filter(t => t.date === today)
  const donePct  = allToday.length > 0 ? Math.round(allToday.filter(t => t.done).length / allToday.length * 100) : 0

  const poolTasks = useMemo(() => {
    return contextTasks.filter(t => !t.done && t.type === 'backlog')
  }, [contextTasks])

  const nudges = useMemo(() => getNudges(state.tasks, checkin), [state.tasks, checkin])

  const active = useMemo(() => {
    return contextTasks.filter(t => !t.done)
  }, [contextTasks])

  const pCnt = active.filter(t => t.pool === 'aile').length
  const wCnt = active.filter(t => t.pool === 'is').length
  const total = pCnt + wCnt
  const pPct = total > 0 ? Math.round(pCnt / total * 100) : 50
  const todayC = hatFiltered.filter(t => t.date === today && !t.done).length
  const overdueC = hatFiltered.filter(t => !t.done && t.date && isPast(t.date)).length
  const totalC = hatFiltered.filter(t => !t.done).length
  const poolC = poolTasks.length
  const noteC = (state.ideas?.length ?? 0) + (state.reminders?.length ?? 0)
  const completedC = state.completed?.length ?? 0
  const clientsC = roleClients.filter(c => c.stage !== 'tamamlandi').length

  const role   = ROLES.find(r => r.id === checkin?.role) ?? ROLES[0]
  const energy = ENERGIES.find(e => e.id === checkin?.energy) ?? ENERGIES[0]

  // ── CATEGORIES ────────────────────────────────────────
  const catGroups = useMemo(() => {
    const tasks = contextTasks
    const groups: Record<string, { total: number; done: number; undone: number; overdue: number; tasks: Task[]; clients: ClientEntry[] }> = {}
    tasks.forEach(t => {
      const c = t.cat || 'Diğer'
      if (!groups[c]) groups[c] = { total: 0, done: 0, undone: 0, overdue: 0, tasks: [], clients: [] }
      groups[c].total++
      if (t.done) groups[c].done++
      else { groups[c].undone++; if (t.date && isPast(t.date)) groups[c].overdue++ }
      groups[c].tasks.push(t)
    })
    // Attach clients to their categories
    roleClients.forEach(cl => {
      if (!groups[cl.cat]) groups[cl.cat] = { total: 0, done: 0, undone: 0, overdue: 0, tasks: [], clients: [] }
      groups[cl.cat].clients.push(cl)
    })
    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data, pct: data.total > 0 ? Math.round(data.done / data.total * 100) : 0 }))
      .sort((a, b) => b.undone - a.undone || b.clients.length - a.clients.length)
  }, [contextTasks, roleClients])

  // ── Pipeline categories (for filter) ──────────────────
  const pipelineCats = useMemo(() => {
    const cats = new Set(roleClients.map(c => c.cat))
    return Array.from(cats)
  }, [roleClients])

  const filteredClients = useMemo(() => {
    return pipelineFilter ? roleClients.filter(c => c.cat === pipelineFilter) : roleClients
  }, [clients, pipelineFilter])

  // ── CUSTOM CATS MERGED ────────────────────────────────
  const customCats = state.customCats ?? []
  const allCatsMerged = useMemo(() => [
    ...ALL_CATS,
    ...customCats.map(c => ({ n: c.n, c: c.c })),
  ], [customCats])

  // ── HELPERS ───────────────────────────────────────────
  const getCatColor = (catName: string) => allCatsMerged.find(c => c.n === catName)?.c ?? '#94a3b8'
  const getCatPool = (catName: string) => {
    if (CATS_W.find(c => c.n === catName)) return 'is'
    if (CATS_P.find(c => c.n === catName)) return 'aile'
    const custom = customCats.find(c => c.n === catName)
    if (custom) return custom.pool
    return null
  }

  const submitNewCat = () => {
    if (!newCatName.trim()) return
    if (allCatsMerged.some(c => c.n === newCatName.trim())) return // duplicate check
    addCustomCat({ n: newCatName.trim(), c: newCatColor, pool: newCatPool })
    setNewCatName(''); setShowAddCat(false)
  }

  // ── QUICK ADD (Context-Aware) ────────────────────────
  const submitQA = () => {
    if (!qaVal.trim()) return
    const effectivePool = hat !== 'all' ? hat : (detectPool(qaVal) ?? qaPool)
    const cat  = expandedCat ? { n: expandedCat } : detectCat(qaVal, effectivePool)
    // If a strip day is selected, use that date; otherwise use qaMode
    const date = stripSel
      ? stripSel
      : qaMode === 'pool' ? null : qaMode === 'tomorrow' ? addDays(1) : today
    const type = (qaMode === 'pool' && !stripSel) ? 'backlog' : 'task'
    addTask({
      title: qaVal.trim(),
      date, cat: cat.n, pool: effectivePool, type,
      priority: '',
    })
    setQaVal('')
    // Toast feedback
    const label = date === today ? 'Bugüne' : date ? `${new Date(date+'T00:00:00').getDate()} ${MONTHS[new Date(date+'T00:00:00').getMonth()]}` : 'Havuza'
    setToast(`✅ "${qaVal.trim().substring(0, 25)}" → ${label} eklendi`)
    setTimeout(() => setToast(null), 2500)
    setTimeout(() => tasksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  // ── ADD CLIENT ────────────────────────────────────────
  const submitClient = () => {
    if (!newClientName.trim()) return
    addClient({
      name: newClientName.trim(),
      cat: newClientCat,
      stage: newClientStage,
      notes: newClientNotes.trim(),
      pool: 'is',
    })
    setNewClientName(''); setNewClientNotes(''); setShowAddClient(false)
  }

  // ── WEEK STRIP ────────────────────────────────────────
  const weekDays = useMemo(() => {
    const dow = d.getDay()
    const mo  = dow === 0 ? -6 : 1 - dow
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + mo + i + (weekOffset * 7))
      const ds = dateToLocalStr(dd)
      const cnt = hatFiltered.filter(t => t.date === ds && !t.done).length
      return { ds, date: dd.getDate(), lbl: DAYS_S[dd.getDay()], cnt, isToday: ds === today }
    })
  }, [state.tasks, checkin, hat, weekOffset, now])

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return 'Bu Hafta'
    if (weekOffset === 1) return 'Gelecek Hafta'
    if (weekOffset === -1) return 'Geçen Hafta'
    const s = weekDays[0], e = weekDays[6]
    if (!s || !e) return ''
    const sd = new Date(s.ds+'T00:00:00'), ed = new Date(e.ds+'T00:00:00')
    return `${sd.getDate()} ${MONTHS[sd.getMonth()]} — ${ed.getDate()} ${MONTHS[ed.getMonth()]}`
  }, [weekDays, weekOffset])

  const goHome = () => { setView('today'); setStripSel(null); setWeekOffset(0) }

  // ── GUARDS ────────────────────────────────────────────
  if (!hydrated) return null
  if (!checkin || checkin.date !== today) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-0 sm:p-4">
        <div className="w-full max-w-lg sm:rounded-2xl overflow-hidden shadow-xl flex flex-col" style={{ minHeight: 560 }}>
          <CheckInScreen onComplete={doCheckIn} />
        </div>
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-screen">

        {/* ═══ TOP BAR ═══ */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 px-4 md:px-8 pt-4 pb-3 flex-shrink-0 sticky top-0 z-30">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg md:text-xl font-bold text-stone-800 tracking-tight">Melis Planner</h1>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{role.icon} {role.name}</span>
                <span className="text-xs text-stone-400 hidden sm:inline">{energy.icon} {energy.name}</span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <span>{DAYS_TR[d.getDay()]}, {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}</span>
                <span className="text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">🕐 {timeStr}</span>
                {donePct > 0 && <span className="text-emerald-500 font-medium">· %{donePct}</span>}
              </p>
            </div>
            <div className="flex gap-2 items-center relative">
              {shareMsg && <span className="text-xs text-emerald-500 font-bold animate-pulse">{shareMsg}</span>}
              <div className="relative">
                <button onClick={() => setShowShareMenu(!showShareMenu)}
                  className="text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-100 hover:border-blue-300 transition-all"
                  title="Günü paylaş">📤</button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl p-2 z-50 min-w-[180px]">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider px-2 py-1 mb-1">Günü Paylaş</p>
                    <button onClick={shareDayWhatsApp} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-green-50 hover:text-green-600 transition-all">
                      💬 WhatsApp ile Gönder
                    </button>
                    <button onClick={shareDayCopy} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-blue-50 hover:text-blue-600 transition-all">
                      📋 Panoya Kopyala
                    </button>
                    <button onClick={shareDaySMS} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-purple-50 hover:text-purple-600 transition-all">
                      ✉️ SMS ile Gönder
                    </button>
                    <div className="border-t border-stone-100 my-1" />
                    <button onClick={() => { navigator.clipboard.writeText(buildDaySummary()); setShareMsg('✅'); setTimeout(() => setShareMsg(''), 2000); setShowShareMenu(false) }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-600 transition-all">
                      📊 Rapor Kopyala
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => exportJSON(state)} className="text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-100">💾</button>
              <button onClick={resetCheckIn} className="text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-100">🔄</button>
            </div>
          </div>
          {/* Hat Toggle */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex bg-stone-100 rounded-2xl p-0.5 md:w-96 flex-shrink-0">
              {([
                { id: 'all' as const, icon: '✨', label: 'Tümü' },
                { id: 'aile' as const, icon: '👩‍👧', label: 'Anne / Kişisel' },
                { id: 'is' as const, icon: '💼', label: 'İş / Girişim' },
              ]).map(h => (
                <button key={h.id} onClick={() => { setHat(h.id); setQaPool(h.id === 'all' ? 'aile' : h.id) }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                    hat === h.id
                      ? h.id === 'aile' ? 'bg-pink-400 text-white shadow-md shadow-pink-200'
                        : h.id === 'is' ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                        : 'bg-white text-stone-700 shadow-sm'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}>{h.icon} {h.label}</button>
              ))}
            </div>
            {total > 0 && (
              <div className="hidden md:flex items-center gap-2 md:flex-1">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden flex">
                  <div style={{ width: `${pPct}%`, background: '#f472b6' }} className="h-full" />
                  <div style={{ width: `${100-pPct}%`, background: '#3b82f6' }} className="h-full" />
                </div>
                <span className="text-[10px] text-pink-500 font-medium">👩‍👧{pCnt}</span>
                <span className="text-[10px] text-blue-500 font-medium">💼{wCnt}</span>
              </div>
            )}
          </div>
        </header>

        {/* ═══ NAVIGATION ═══ */}
        <nav className="bg-white border-b border-stone-200 px-4 md:px-8 py-1.5 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {([
              { id: 'today' as View, icon: '☀️', label: 'Bugün', count: todayC },
              { id: 'all'   as View, icon: '📦', label: 'Tümü', count: totalC },
              { id: 'cats'  as View, icon: '🏷️', label: 'Kategoriler', count: catGroups.length },
              { id: 'pipeline' as View, icon: '🤝', label: 'Pipeline', count: clientsC },
              { id: 'pool'  as View, icon: '📋', label: 'Havuz', count: poolC },
              { id: 'notes' as View, icon: '📝', label: 'Notlar', count: noteC },
            ]).map(tab => (
              <button key={tab.id} onClick={() => { setView(tab.id); setStripSel(null) }}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  view === tab.id && !stripSel
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 border border-transparent'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  view === tab.id && !stripSel ? 'bg-blue-100 text-blue-600' : 'bg-stone-100 text-stone-400'
                }`}>{tab.count}</span>
              </button>
            ))}
            {overdueC > 0 && (
              <button onClick={goHome} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 ml-auto animate-pulse">
                🔥 {overdueC}
              </button>
            )}
          </div>
        </nav>

        {/* ═══ WEEK STRIP (compact) ═══ */}
        {(view === 'today' || view === 'all' || stripSel) && (
          <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekOffset(o => o - 1)} className="w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:bg-stone-100 text-sm flex-shrink-0">‹</button>
              <button onClick={() => setWeekOffset(0)} className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${weekOffset === 0 ? 'text-blue-600 bg-blue-50' : 'text-stone-400 hover:bg-stone-100'}`}>{weekLabel}</button>
              <div className="flex gap-0.5 md:gap-1 flex-1">
                {weekDays.map(wd => (
                  <button key={wd.ds} onClick={() => { setStripSel(wd.ds === stripSel ? null : wd.ds); setView('today') }}
                    className={`flex-1 text-center py-1 md:py-1.5 rounded-lg transition-all ${
                      wd.isToday ? 'bg-blue-50 ring-1 ring-blue-300' : wd.ds === stripSel ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-stone-50'
                    }`}>
                    <p className={`text-[8px] md:text-[10px] font-bold uppercase ${wd.isToday ? 'text-blue-500' : 'text-stone-400'}`}>{wd.lbl}</p>
                    <p className={`text-xs md:text-sm font-bold leading-tight ${wd.isToday ? 'text-blue-600' : wd.ds === stripSel ? 'text-amber-600' : 'text-stone-700'}`}>{wd.date}</p>
                    {wd.cnt > 0 && <p className={`text-[8px] font-bold ${wd.isToday ? 'text-blue-400' : 'text-stone-400'}`}>{wd.cnt}</p>}
                  </button>
                ))}
              </div>
              <button onClick={() => setWeekOffset(o => o + 1)} className="w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:bg-stone-100 text-sm flex-shrink-0">›</button>
            </div>
          </div>
        )}

        {/* ═══ QUICK ADD ═══ */}
        {(view === 'today' || view === 'all' || stripSel) && (
          <div className="bg-white border-b border-stone-200 px-4 md:px-8 py-2.5 flex-shrink-0">
            <div className="flex gap-2 mb-2">
              <input value={qaVal} onChange={e => setQaVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitQA()}
                placeholder="+ Hızlı görev ekle..." className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-stone-400" />
              <button onClick={submitQA} className="w-10 h-10 bg-blue-500 rounded-xl text-white text-lg flex items-center justify-center hover:bg-blue-600 active:scale-95 shadow-sm">+</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {hat === 'all' && (['aile', 'is'] as const).map(p => (
                <button key={p} onClick={() => setQaPool(p)} className={`text-xs px-3 py-1 rounded-full border ${qaPool === p ? 'border-blue-400 bg-blue-50 text-blue-600 font-bold' : 'border-stone-200 text-stone-400'}`}>
                  {p === 'aile' ? '👩‍👧 Anne' : '💼 İş'}
                </button>
              ))}
              {hat === 'all' && <span className="w-px h-5 bg-stone-200 self-center" />}
              {stripSel ? (
                <span className="text-xs px-3 py-1 rounded-full border border-blue-400 bg-blue-50 text-blue-600 font-bold">
                  📌 {(() => { const sd = new Date(stripSel+'T00:00:00'); return `${DAYS_TR[sd.getDay()]} ${sd.getDate()} ${MONTHS[sd.getMonth()]}` })()}
                </span>
              ) : ([{ id: 'today' as const, l: '☀️ Bugün' }, { id: 'tomorrow' as const, l: '📅 Yarın' }, { id: 'pool' as const, l: '📋 Havuza' }]).map(m => (
                <button key={m.id} onClick={() => setQaMode(m.id)} className={`text-xs px-3 py-1 rounded-full border ${qaMode === m.id ? 'border-blue-400 bg-blue-50 text-blue-600 font-bold' : 'border-stone-200 text-stone-400'}`}>{m.l}</button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ BREADCRUMB ═══ */}
        {(view !== 'today' || stripSel) && (
          <div className="bg-stone-50/80 border-b border-stone-200 px-4 md:px-8 py-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <button onClick={goHome} className="text-blue-500 hover:text-blue-600 font-medium">☀️ Bugün</button>
              <span className="text-stone-300">›</span>
              <span className="text-stone-600 font-medium">
                {stripSel ? (() => { const dd = new Date(stripSel+'T00:00:00'); return `${DAYS_TR[dd.getDay()]} ${dd.getDate()} ${MONTHS[dd.getMonth()]}` })()
                  : view === 'cats' ? '🏷️ Kategoriler' : view === 'pipeline' ? '🤝 Pipeline' : view === 'all' ? '📦 Tüm Görevler' : view === 'pool' ? '📋 Havuz' : '📝 Notlar'}
              </span>
              {view === 'cats' && expandedCat && <><span className="text-stone-300">›</span><span className="text-stone-800 font-bold">{expandedCat}</span></>}
            </div>
          </div>
        )}

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">

          {/* ─── STRIP DAY ─── */}
          {stripSel && (() => {
            const dd = new Date(stripSel+'T00:00:00')
            const dayTasks = (hat === 'all'
              ? filterByRoleEnergy(state.tasks.filter(t => t.date === stripSel), checkin)
              : filterByRoleEnergy(state.tasks.filter(t => t.date === stripSel), checkin).filter(t => t.pool === hat)
            ).sort((a, b) => { if (a.done !== b.done) return a.done ? 1 : -1; return urgencyScore(b) - urgencyScore(a) })
            return (
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-stone-800">{DAYS_TR[dd.getDay()]} {dd.getDate()} {MONTHS[dd.getMonth()]}</h2>
                  <span className="text-sm text-stone-500 bg-white px-3 py-1 rounded-full border font-medium">{dayTasks.filter(t => !t.done).length} görev</span>
                </div>
                {dayTasks.length === 0 && <div className="text-center py-16 bg-white rounded-2xl border"><p className="text-4xl mb-3">📭</p><p className="text-stone-400">Bu gün için görev yok</p></div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{dayTasks.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} showDate={false} />)}</div>
              </div>
            )
          })()}

          {/* ─── TODAY VIEW ─── */}
          {!stripSel && view === 'today' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left sidebar */}
                <div className="lg:col-span-1 space-y-3 order-last lg:order-first">
                  <div className="bg-white rounded-2xl border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-stone-600">Günlük İlerleme</p>
                      <span className={`text-2xl font-black ${donePct === 100 ? 'text-emerald-500' : 'text-blue-600'}`}>%{donePct}</span>
                    </div>
                    <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${donePct}%`, background: donePct === 100 ? '#10b981' : donePct >= 50 ? '#3b82f6' : '#f59e0b' }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-stone-400">
                      <span>✅ {allToday.filter(t => t.done).length}</span><span>⏳ {allToday.filter(t => !t.done).length}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { n: overdueC, l: 'Gecikmiş', c: 'text-red-500' },
                      { n: todayC, l: 'Bugün', c: 'text-blue-500' },
                      { n: tomorrow.length, l: 'Yarın', c: 'text-amber-500' },
                      { n: clientsC, l: 'Aktif Müşteri', c: 'text-emerald-500' },
                    ].map(s => (
                      <div key={s.l} className="bg-white rounded-xl border p-3 text-center">
                        <p className={`text-2xl font-black ${s.c}`}>{s.n}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {nudges.map((n, i) => <NudgeCard key={i} nudge={n} />)}
                  <DistChart tasks={state.tasks} />
                  {poolC > 0 && (
                    <button onClick={() => { setView('pool'); setStripSel(null) }}
                      className="flex items-center gap-2 w-full p-3 bg-white rounded-xl border border-dashed text-sm text-stone-500 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                      📋 {poolC} havuzda <span className="ml-auto text-blue-500 text-xs font-bold">→</span>
                    </button>
                  )}
                  <button onClick={() => { setView('pipeline'); setStripSel(null) }}
                    className="flex items-center gap-2 w-full p-3 bg-white rounded-xl border border-dashed text-sm text-stone-500 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
                    🤝 {clientsC} aktif müşteri <span className="ml-auto text-emerald-500 text-xs font-bold">→</span>
                  </button>
                </div>
                {/* Right: tasks */}
                <div ref={tasksRef} className="lg:col-span-2 space-y-5">
                  {urgentList.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 py-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-bold text-red-600 uppercase tracking-wide flex-1">Acil / Gecikmiş</span>
                        <span className="text-xs text-white bg-red-500 px-2.5 py-0.5 rounded-full font-bold">{urgentList.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{urgentList.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} />)}</div>
                    </section>
                  )}
                  <section>
                    <div className="flex items-center gap-2 py-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm font-bold text-stone-700 uppercase tracking-wide flex-1">Bugünkü Görevler</span>
                      <button onClick={shareDayCopy} className="text-[10px] px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition-all" title="Tümünü kopyala">📤</button>
                      <span className="text-xs text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full font-bold">{normalToday.length + todayDone.length}</span>
                    </div>
                    {normalToday.length === 0 && todayDone.length === 0 && <div className="text-center py-12 bg-white rounded-2xl border"><p className="text-4xl mb-3">{urgentList.length ? '👆' : '🎉'}</p><p className="text-stone-400">{urgentList.length ? 'Aciller dışında bugün temiz' : 'Bugün boş — iyi günler!'}</p></div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{normalToday.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} />)}</div>
                    {todayDone.length > 0 && (
                      <><div className="flex items-center gap-2 py-2 mt-4 mb-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-xs font-bold text-emerald-600 uppercase flex-1">Tamamlanan</span><span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">{todayDone.length}</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{todayDone.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} />)}</div></>
                    )}
                  </section>
                  {(tomorrow.length > 0 || thisWeek.length > 0) && (
                    <section>
                      <div className="flex items-center gap-2 py-2 mb-2"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-sm font-bold text-stone-700 uppercase tracking-wide flex-1">Yaklaşan</span></div>
                      {tomorrow.length > 0 && <><p className="text-xs text-stone-500 font-bold py-1.5 border-b mb-2">Yarın · {tomorrow.length}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">{tomorrow.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} />)}</div></>}
                      {thisWeek.length > 0 && <><p className="text-xs text-stone-500 font-bold py-1.5 border-b mb-2">Bu Hafta · {thisWeek.length}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{thisWeek.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} showDate />)}</div></>}
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── ALL VIEW ─── */}
          {!stripSel && view === 'all' && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Tüm Aktif Görevler <span className="text-sm text-stone-400 font-normal">({totalC})</span></h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {hatFiltered.filter(t => !t.done && t.type !== 'backlog').sort((a, b) => urgencyScore(b) - urgencyScore(a))
                  .map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} showDate />)}
              </div>
            </div>
          )}

          {/* ─── CATEGORIES VIEW ─── */}
          {!stripSel && view === 'cats' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-800">Kategoriler</h2>
                  <p className="text-xs text-stone-400">{catGroups.length} kategori · {state.tasks.length} görev{customCats.length > 0 ? ` · ${customCats.length} özel` : ''}</p>
                </div>
                <button onClick={() => setShowAddCat(!showAddCat)}
                  className="text-xs px-3 py-1.5 rounded-full border border-blue-300 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-all">
                  + Kategori Ekle
                </button>
              </div>

              {/* Add Category Form */}
              {showAddCat && (
                <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 mb-6 shadow-md">
                  <h3 className="text-sm font-bold text-stone-700 mb-3">🏷️ Yeni Kategori Ekle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Kategori adı..."
                      className="bg-stone-50 border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    <div className="flex items-center gap-2">
                      <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border cursor-pointer" />
                      <span className="text-xs text-stone-400">Renk seç</span>
                    </div>
                    <div className="flex gap-2">
                      {(['is', 'aile'] as const).map(p => (
                        <button key={p} onClick={() => setNewCatPool(p)}
                          className={`flex-1 text-xs px-3 py-2 rounded-xl border font-bold transition-all ${
                            newCatPool === p
                              ? p === 'is' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-pink-400 bg-pink-50 text-pink-600'
                              : 'border-stone-200 text-stone-400'
                          }`}>
                          {p === 'is' ? '💼 İş' : '👩‍👧 Kişisel'}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={submitNewCat} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600">Ekle</button>
                      <button onClick={() => setShowAddCat(false)} className="px-4 py-2 text-stone-400 text-sm">İptal</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {catGroups.map(cg => {
                  const color = getCatColor(cg.name)
                  const isExp = expandedCat === cg.name
                  const pool = getCatPool(cg.name)
                  return (
                    <div key={cg.name} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                      isExp ? 'border-blue-300 shadow-lg col-span-full' : 'border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200'
                    }`}>
                      <button onClick={() => setExpandedCat(isExp ? null : cg.name)} className="w-full text-left p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                            <h3 className="text-sm font-bold text-stone-800">{cg.name}</h3>
                            {pool && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${pool === 'aile' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>{pool === 'aile' ? '👩‍👧' : '💼'}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {cg.clients.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-600">🤝 {cg.clients.length}</span>}
                            <span className="text-xs text-stone-400">{isExp ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${cg.pct}%`, background: color }} /></div>
                          <span className="text-xs font-bold" style={{ color }}>%{cg.pct}</span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-stone-400 font-medium">
                          <span>✅ {cg.done}</span><span>⏳ {cg.undone}</span>
                          {cg.overdue > 0 && <span className="text-red-500 font-bold">🔥 {cg.overdue}</span>}
                        </div>
                      </button>

                      {isExp && (
                        <div className="border-t border-stone-100">
                          {/* Pipeline within category */}
                          {cg.clients.length > 0 && (
                            <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-b border-stone-100">
                              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">🤝 Pipeline — {cg.name}</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                {PIPELINE_STAGES.map(st => {
                                  const cnt = cg.clients.filter(c => c.stage === st.id).length
                                  return (
                                    <div key={st.id} className={`rounded-xl border p-2 text-center ${st.bg} ${st.border}`}>
                                      <p className="text-lg">{st.icon}</p>
                                      <p className={`text-xl font-black ${st.color}`}>{cnt}</p>
                                      <p className="text-[9px] font-bold text-stone-500">{st.label}</p>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="space-y-1.5">
                                {cg.clients.map(cl => {
                                  const stg = PIPELINE_STAGES.find(s => s.id === cl.stage)!
                                  return (
                                    <div key={cl.id} className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-stone-100">
                                      <span className="text-sm">{stg.icon}</span>
                                      <span className="text-sm font-bold text-stone-800 flex-1">{cl.name}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${stg.bg} ${stg.border} ${stg.color}`}>{stg.label}</span>
                                      {cl.notes && <span className="text-[10px] text-stone-400 truncate max-w-32 hidden md:inline">{cl.notes}</span>}
                                      <select value={cl.stage} onChange={e => updateClient(cl.id, { stage: e.target.value as PipelineStage })}
                                        className="text-[10px] bg-stone-50 border rounded px-1 py-0.5 text-stone-500">
                                        {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                                      </select>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          {/* Tasks within category */}
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {cg.tasks.sort((a, b) => { if (a.done !== b.done) return a.done ? 1 : -1; return urgencyScore(b) - urgencyScore(a) })
                                .map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onClick={setEditingTask} showDate />)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── PIPELINE VIEW ─── */}
          {!stripSel && view === 'pipeline' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-stone-800">Müşteri Pipeline</h2>
                  <p className="text-xs text-stone-400">
                    {clients.length} müşteri · {clients.filter(c => c.stage === 'aktif').length} aktif · {clients.filter(c => c.stage === 'teklif').length} teklif · {clients.filter(c => c.stage === 'lead').length} lead
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Category filter */}
                  <button onClick={() => setPipelineFilter(null)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${!pipelineFilter ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-stone-400 border-stone-200'}`}>
                    Tümü
                  </button>
                  {pipelineCats.map(cat => (
                    <button key={cat} onClick={() => setPipelineFilter(pipelineFilter === cat ? null : cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-bold transition-all ${pipelineFilter === cat ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-stone-400 border-stone-200'}`}>
                      {cat}
                    </button>
                  ))}
                  <button onClick={() => setShowAddClient(!showAddClient)}
                    className="text-xs px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100">
                    + Müşteri Ekle
                  </button>
                </div>
              </div>

              {/* Add client form */}
              {showAddClient && (
                <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 mb-6 shadow-md">
                  <h3 className="text-sm font-bold text-stone-700 mb-3">🤝 Yeni Müşteri / Lead Ekle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Müşteri adı..."
                      className="bg-stone-50 border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                    <select value={newClientCat} onChange={e => setNewClientCat(e.target.value)}
                      className="bg-stone-50 border rounded-xl px-3 py-2 text-sm outline-none">
                      <optgroup label="İş">
                        {CATS_W.map(c => <option key={c.n} value={c.n}>{c.n}</option>)}
                      </optgroup>
                      <optgroup label="Kişisel">
                        {CATS_P.map(c => <option key={c.n} value={c.n}>{c.n}</option>)}
                      </optgroup>
                      {customCats.length > 0 && (
                        <optgroup label="Özel Kategoriler">
                          {customCats.map(c => <option key={c.n} value={c.n}>{c.n}</option>)}
                        </optgroup>
                      )}
                    </select>
                    <select value={newClientStage} onChange={e => setNewClientStage(e.target.value as PipelineStage)}
                      className="bg-stone-50 border rounded-xl px-3 py-2 text-sm outline-none">
                      {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                    </select>
                    <input value={newClientNotes} onChange={e => setNewClientNotes(e.target.value)} placeholder="Not..."
                      className="bg-stone-50 border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={submitClient} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600">Ekle</button>
                    <button onClick={() => setShowAddClient(false)} className="px-4 py-2 text-stone-400 text-sm">İptal</button>
                  </div>
                </div>
              )}

              {/* Pipeline stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {PIPELINE_STAGES.map(stage => {
                  const count = filteredClients.filter(c => c.stage === stage.id).length
                  return (
                    <div key={stage.id} className={`rounded-2xl border-2 p-4 text-center ${stage.bg} ${stage.border}`}>
                      <p className="text-3xl mb-1">{stage.icon}</p>
                      <p className={`text-3xl font-black ${stage.color}`}>{count}</p>
                      <p className="text-xs font-bold text-stone-500 uppercase">{stage.label}</p>
                    </div>
                  )
                })}
              </div>

              {/* Pipeline columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PIPELINE_STAGES.map(stage => {
                  const stageClients = filteredClients.filter(c => c.stage === stage.id)
                  return (
                    <div key={stage.id}>
                      <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${stage.border}`}>
                        <span className="text-lg">{stage.icon}</span>
                        <h3 className={`text-sm font-bold ${stage.color}`}>{stage.label}</h3>
                        <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-bold ml-auto">{stageClients.length}</span>
                      </div>
                      {stageClients.length === 0 && <div className="text-center py-8 bg-white rounded-xl border border-dashed"><p className="text-stone-300 text-sm">Boş</p></div>}
                      <div className="space-y-2">
                        {stageClients.map(client => {
                          const relatedTasks = state.tasks.filter(t => t.title.toLowerCase().includes(client.name.toLowerCase().split('/')[0].split('&')[0].trim()))
                          const doneTasks = relatedTasks.filter(t => t.done).length
                          const undoneTasks = relatedTasks.filter(t => !t.done)
                          return (
                            <div key={client.id} className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-sm font-bold text-stone-800">{client.name}</h4>
                                  <p className="text-[10px] text-stone-400 font-medium">{client.cat}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <select value={client.stage} onChange={e => updateClient(client.id, { stage: e.target.value as PipelineStage })}
                                    className="text-[10px] bg-stone-50 border rounded px-1 py-0.5">
                                    {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                                  </select>
                                  <button onClick={() => deleteClient(client.id)} className="text-[10px] text-red-400 hover:text-red-600 px-1">✕</button>
                                </div>
                              </div>
                              {client.notes && <p className="text-xs text-stone-500 mb-2 leading-relaxed">{client.notes}</p>}
                              {relatedTasks.length > 0 && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${relatedTasks.length > 0 ? Math.round(doneTasks / relatedTasks.length * 100) : 0}%` }} /></div>
                                    <span className="text-[10px] text-stone-400 font-bold">{doneTasks}/{relatedTasks.length}</span>
                                  </div>
                                </div>
                              )}
                              {undoneTasks.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {undoneTasks.slice(0, 3).map(t => (
                                    <div key={t.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 cursor-pointer" onClick={() => setEditingTask(t)}>
                                      <input type="checkbox" checked={false} onChange={() => toggleTask(t.id)} className="w-3.5 h-3.5 rounded accent-blue-500 flex-shrink-0" />
                                      <span className="text-xs text-stone-600 truncate">{t.title}</span>
                                    </div>
                                  ))}
                                  {undoneTasks.length > 3 && <p className="text-[10px] text-stone-400 text-center">+{undoneTasks.length - 3} daha</p>}
                                </div>
                              )}
                              {/* Actions */}
                              <div className="flex gap-1 mt-2 pt-2 border-t border-stone-50">
                                <a href={`https://wa.me/?text=${encodeURIComponent(`${client.name} — ${client.notes || ''}`)}`} target="_blank" rel="noopener noreferrer"
                                  className="text-[9px] px-2 py-1 rounded bg-green-50 text-green-600 font-bold border border-green-200 hover:bg-green-100">💬</a>
                                <button onClick={() => {
                                  setEditingClient(null)
                                  const notes = prompt('Not güncelle:', client.notes)
                                  if (notes !== null) updateClient(client.id, { notes })
                                }} className="text-[9px] px-2 py-1 rounded bg-stone-50 text-stone-500 font-bold border border-stone-200 hover:bg-stone-100">✏️</button>
                                <button onClick={() => navigator.clipboard.writeText(`${client.name} — ${client.notes || ''} [${PIPELINE_STAGES.find(s => s.id === client.stage)?.label}]`)}
                                  className="text-[9px] px-2 py-1 rounded bg-stone-50 text-stone-500 font-bold border border-stone-200 hover:bg-stone-100">📋</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── POOL VIEW ─── */}
          {!stripSel && view === 'pool' && (
            <div className="max-w-7xl mx-auto">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Görev Havuzu <span className="text-sm text-stone-400 font-normal">({poolC})</span></h2>
              {poolC === 0 && <div className="text-center py-16 bg-white rounded-2xl border"><p className="text-4xl mb-3">📋</p><p className="text-stone-400">Havuz boş</p></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(poolTasks.reduce<Record<string, Task[]>>((acc, t) => { const c = t.cat || 'Diğer'; (acc[c] = acc[c] ?? []).push(t); return acc }, {}))
                  .map(([cat, items]) => (
                    <div key={cat} className="bg-white rounded-2xl border p-4 shadow-sm">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: getCatColor(cat) }} />
                        <p className="text-sm font-bold text-stone-700 flex-1">{cat}</p>
                        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full font-bold">{items.length}</span>
                      </div>
                      {items.map(t => (
                        <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-stone-50 mb-1 group">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.pool === 'aile' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>{t.pool === 'aile' ? '👩‍👧' : '💼'}</span>
                          <span className="flex-1 text-sm text-stone-700 cursor-pointer truncate" onClick={() => setEditingTask(t)}>{t.title}</span>
                          <button onClick={() => updateTask(t.id, { date: today, type: 'task' })} className="text-[10px] px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 font-bold opacity-0 group-hover:opacity-100">☀️ Bugüne</button>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ─── NOTES VIEW ─── */}
          {!stripSel && view === 'notes' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-bold text-stone-800 mb-4">Notlar & Fikirler <span className="text-sm text-stone-400 font-normal">({noteC})</span></h2>
              <SmartNotes tasks={state.tasks} ideas={state.ideas ?? []} reminders={state.reminders ?? []}
                onAddNote={addSmartNote} onUpdateTask={updateTask} onIdeaToTask={ideaToTask} onDeleteIdea={deleteIdea} onDeleteReminder={deleteReminder} />
            </div>
          )}
        </main>

        {/* ═══ BOTTOM NAV (mobile) ═══ */}
        <div className="flex md:hidden bg-white border-t px-1 pt-1 pb-5 flex-shrink-0">
          {([
            { id: 'today' as View, icon: '☀️', label: 'Bugün' },
            { id: 'cats'  as View, icon: '🏷️', label: 'Kategori' },
            { id: 'pipeline' as View, icon: '🤝', label: 'Pipeline' },
            { id: 'pool'  as View, icon: '📋', label: 'Havuz' },
            { id: 'notes' as View, icon: '📝', label: 'Not' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id); setStripSel(null) }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl ${view === tab.id && !stripSel ? 'bg-blue-50' : ''}`}>
              <span className={`text-lg ${view === tab.id && !stripSel ? '' : 'opacity-30'}`}>{tab.icon}</span>
              <span className={`text-[8px] font-bold ${view === tab.id && !stripSel ? 'text-blue-500' : 'text-stone-400'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {editingTask && <TaskModal task={editingTask} onSave={(id, updates) => updateTask(id, updates)} onDelete={deleteTask} onClose={() => setEditingTask(null)} customCats={customCats} />}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-bounce-in max-w-[90vw]">
          {toast}
        </div>
      )}
    </div>
  )
}

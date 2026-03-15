import type { Task, CheckIn, Nudge } from './types'
import { todayStr, addDays, isPast } from './utils'
import { MONTHS } from './constants'

export function getNudges(tasks: Task[], checkin: CheckIn | null): Nudge[] {
  const nudges: Nudge[] = []
  const today = todayStr()
  const active = tasks.filter(t => !t.done && t.type !== 'backlog')

  // 1. Erteleme paterni — status quo bias
  const late = active.filter(t => {
    if (!t.date || !isPast(t.date)) return false
    const diff = Math.ceil(
      (new Date(today + 'T00:00:00').getTime() - new Date(t.date + 'T00:00:00').getTime()) / 86400000
    )
    return diff >= 3
  })
  if (late.length > 0) {
    const diff = Math.ceil(
      (new Date(today + 'T00:00:00').getTime() - new Date(late[0].date! + 'T00:00:00').getTime()) / 86400000
    )
    nudges.push({
      type: 'warn',
      icon: '⏳',
      label: 'Erteleme Paterni',
      text: `"${late[0].title.substring(0, 38)}${late[0].title.length > 38 ? '…' : ''}" ${diff} gündür bekliyor. Status quo bias devrede — küçük bir adım başlamak için yeter.`,
    })
  }

  // 2. İş/kişisel denge — sürdürülebilirlik
  const weekTasks = active.filter(t => t.date && t.date >= today && t.date <= addDays(7))
  if (weekTasks.length >= 4) {
    const workPct = Math.round(weekTasks.filter(t => t.pool === 'is').length / weekTasks.length * 100)
    if (workPct >= 75) {
      nudges.push({
        type: 'warn',
        icon: '⚖️',
        label: 'Denge Uyarısı',
        text: `Bu hafta görevlerin %${workPct}'i iş. Kişisel alan daralıyor — sürdürülebilirlik riski. Bir kişisel görev ekle.`,
      })
    } else if (workPct <= 20 && weekTasks.filter(t => t.pool === 'is').length > 0) {
      nudges.push({
        type: 'info',
        icon: '⚖️',
        label: 'Denge Notu',
        text: 'Bu hafta ağırlıklı kişisel gündem. Lâl ve akademik alana zaman var mı?',
      })
    }
  }

  // 3. Çakışma tespiti — 14 gün içinde
  const byDate: Record<string, number> = {}
  active.forEach(t => {
    if (t.date && t.date >= today && t.date <= addDays(14)) {
      byDate[t.date] = (byDate[t.date] ?? 0) + 1
    }
  })
  const crowded = Object.keys(byDate).filter(d => byDate[d] >= 5).sort()
  if (crowded.length > 0) {
    const d = new Date(crowded[0] + 'T00:00:00')
    nudges.push({
      type: 'danger',
      icon: '📌',
      label: 'Çakışma',
      text: `${d.getDate()} ${MONTHS[d.getMonth()]}'de ${byDate[crowded[0]]} görev yığılmış. Şimdi öne almak sonraki baskıyı azaltır.`,
    })
  }

  // 4. Düşük enerji modu bildirimi
  if (checkin?.energy === 'low') {
    const critCount = active.filter(t => t.date === today && t.priority === 'high').length
    nudges.push({
      type: 'info',
      icon: '🌙',
      label: 'Düşük Enerji Modu',
      text: `Bugün ${critCount} kritik görev önünde. Geri kalanlar seni bekliyor — enerji döndüğünde orada olacaklar.`,
    })
  }

  return nudges.slice(0, 2)
}

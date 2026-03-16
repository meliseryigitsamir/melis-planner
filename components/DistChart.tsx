'use client'

import { useMemo } from 'react'
import type { Task } from '@/lib/types'
import { ROLE_CATS } from '@/lib/constants'
import { MONTHS, DAYS_S } from '@/lib/constants'
import { todayStr, dateToLocalStr } from '@/lib/utils'

interface Props {
  tasks: Task[]
}

export default function DistChart({ tasks }: Props) {
  const today = todayStr()
  const d0 = new Date()
  const dow = d0.getDay()
  const mo = dow === 0 ? -6 : 1 - dow

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(d0)
      d.setDate(d.getDate() + mo + i)
      const ds = dateToLocalStr(d)
      const dayTasks = tasks.filter(t => t.date === ds)
      const anne = dayTasks.filter(t =>
        ROLE_CATS.anne?.some(c => t.cat?.includes(c.split(' ')[0]))
      ).length
      const akademi = dayTasks.filter(t =>
        ROLE_CATS.akademi?.some(c => t.cat?.includes(c.split(' ')[0]))
      ).length
      const girisim = dayTasks.filter(t =>
        ROLE_CATS.girisim?.some(c => t.cat?.includes(c.split(' ')[0]))
      ).length
      // BUG FIX: use actual day-of-week instead of loop index
      return { ds, d, lbl: DAYS_S[d.getDay()], anne, akademi, girisim, isToday: ds === today }
    })
  }, [tasks, today])

  const maxVal = Math.max(1, ...days.map(d => d.anne + d.akademi + d.girisim))

  // Trend analysis — i=4=Friday, i=5=Saturday, i=6=Sunday (loop starts Monday)
  const fri = days[4]
  const friTotal = fri.anne + fri.akademi + fri.girisim
  const hasData = days.some(d => d.anne + d.akademi + d.girisim > 0)
  let trend = 'Check-in verisi birikince haftalık örüntüler burada görünecek.'
  if (hasData && friTotal === 0) {
    trend = 'Cuma görünür görev yok — hafta sonu baskısı riski. Peak-end etkisini göz önünde bulundur.'
  } else if (hasData) {
    const wkndTotal = days[5].anne + days[5].akademi + days[5].girisim + days[6].anne + days[6].akademi + days[6].girisim
    if (wkndTotal > 4) trend = 'Hafta sonu yoğun görünüyor — peak-end etkisi: haftanın sonu tüm haftanın algısını belirler.'
    else trend = 'Bu hafta denge iyi görünüyor.'
  }

  return (
    <div className="bg-white rounded-xl border border-stone-100 p-3 md:p-4 mb-2">
      <p className="text-[10px] md:text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">
        Haftalık Dağılım
      </p>

      {/* Bars */}
      <div className="flex gap-1.5 items-end h-14 mb-2">
        {days.map(day => {
          const total = day.anne + day.akademi + day.girisim
          const maxH = 50
          const ah = total > 0 ? Math.round(day.anne / maxVal * maxH) : 0
          const kh = total > 0 ? Math.round(day.akademi / maxVal * maxH) : 0
          const gh = total > 0 ? Math.round(day.girisim / maxVal * maxH) : 0
          return (
            <div key={day.ds} className="flex-1 flex flex-col items-center gap-0">
              <div className="flex-1 w-full flex flex-col justify-end gap-px">
                {gh > 0 && <div style={{ height: gh, background: '#60a5fa' }} className="w-full rounded-t-sm" />}
                {kh > 0 && <div style={{ height: kh, background: '#818cf8' }} className="w-full" />}
                {ah > 0 && <div style={{ height: ah, background: '#f472b6' }} className="w-full" />}
                {total === 0 && <div className="w-full h-1 bg-stone-100 rounded" />}
              </div>
              <p className={`text-[9px] md:text-[10px] mt-1 font-medium ${day.isToday ? 'text-blue-500' : 'text-stone-400'}`}>
                {day.lbl}
              </p>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-2">
        {[
          { color: '#f472b6', label: 'Anne' },
          { color: '#818cf8', label: 'Akademi' },
          { color: '#60a5fa', label: 'Girişimci' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="text-[9px] md:text-[10px] text-stone-400">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Trend */}
      <p className="text-[10px] md:text-xs text-stone-500 leading-relaxed border-t border-stone-100 pt-2">
        {trend}
      </p>
    </div>
  )
}

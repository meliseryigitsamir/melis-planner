'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'
import { fmtDate, isPast, catColor, todayStr } from '@/lib/utils'

interface Props {
  task: Task
  onToggle: (id: number) => void
  onClick: (task: Task) => void
  showDate?: boolean
}

function buildGCalUrl(task: Task): string {
  const title = encodeURIComponent(task.title)
  const date = task.date ? task.date.replace(/-/g, '') : todayStr().replace(/-/g, '')
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${encodeURIComponent('Melis Planner')}`
}

function buildWhatsAppUrl(task: Task): string {
  const text = encodeURIComponent(`📋 ${task.title}${task.date ? `\n📅 ${task.date}` : ''}${task.cat ? `\n🏷️ ${task.cat}` : ''}`)
  return `https://wa.me/?text=${text}`
}

export default function TaskCard({ task, onToggle, onClick, showDate = true }: Props) {
  const [showActions, setShowActions] = useState(false)
  const od = !task.done && !!task.date && isPast(task.date)
  const isToday = task.date === todayStr()
  const cc = catColor(task.cat)

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `${task.title}${task.date ? ` — ${task.date}` : ''}${task.cat ? ` [${task.cat}]` : ''}`
    navigator.clipboard.writeText(text)
    setShowActions(false)
  }

  return (
    <div
      className={`relative bg-white rounded-xl p-3 cursor-pointer transition-all border hover:shadow-md group ${
        task.done ? 'opacity-40' : ''
      } ${od ? 'border-l-[3px] border-l-red-400 border-t border-r border-b border-stone-100' : isToday && !task.done ? 'border-l-[3px] border-l-blue-400 border-t border-r border-b border-stone-100' : 'border-stone-100 hover:border-stone-200'}`}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onToggle(task.id) }}
          className={`w-5 h-5 min-w-5 rounded-full border-2 flex items-center justify-center text-[10px] mt-0.5 flex-shrink-0 transition-all ${
            task.done
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-stone-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {task.done ? '✓' : ''}
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0" onClick={() => onClick(task)}>
          <p className={`text-[13px] md:text-sm text-stone-800 leading-snug break-words ${task.done ? 'line-through' : ''}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              task.pool === 'aile' ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'
            }`}>
              {task.pool === 'aile' ? '👩‍👧' : '💼'}
            </span>
            {task.priority === 'high' && (
              <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-50 text-red-500">🔴</span>
            )}
            {task.cat && (
              <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: cc + '18', color: cc }}>
                {task.cat}
              </span>
            )}
            {showDate && task.date && (
              <span className={`text-[10px] md:text-xs ${od && !task.done ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                {fmtDate(task.date)}
              </span>
            )}
          </div>
        </div>

        {/* Action toggle */}
        <button
          onClick={e => { e.stopPropagation(); setShowActions(!showActions) }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-500 hover:bg-stone-100 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          ⋯
        </button>
      </div>

      {/* Action buttons row */}
      {showActions && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-stone-100 animate-in slide-in-from-top-1" onClick={e => e.stopPropagation()}>
          <a href={buildWhatsAppUrl(task)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-200">
            💬 WhatsApp
          </a>
          <a href={buildGCalUrl(task)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200">
            📅 Takvim
          </a>
          <button onClick={copyToClipboard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors border border-stone-200">
            📋 Kopyala
          </button>
          <a href={`sms:?body=${encodeURIComponent(task.title)}`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-200">
            ✉️ Mesaj
          </a>
        </div>
      )}
    </div>
  )
}

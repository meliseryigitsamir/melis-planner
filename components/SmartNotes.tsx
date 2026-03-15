'use client'

import { useState } from 'react'
import type { Task, Idea, Reminder, NoteType } from '@/lib/types'
import { catColor } from '@/lib/utils'

interface Props {
  tasks: Task[]
  ideas: Idea[]
  reminders: Reminder[]
  onAddNote: (text: string, type: NoteType) => void
  onUpdateTask: (id: number, updates: Partial<Task>) => void
  onIdeaToTask: (id: number) => void
  onDeleteIdea: (id: number) => void
  onDeleteReminder: (id: number) => void
}

const TYPES: { id: NoteType; icon: string; label: string; sub: string }[] = [
  { id: 'aksiyon', icon: '⚡', label: 'Aksiyon',  sub: '→ Havuz' },
  { id: 'fikir',   icon: '💡', label: 'Fikir',    sub: '→ Idea Bank' },
  { id: 'takip',   icon: '👁',  label: 'Takip',    sub: '→ Gözat' },
]

export default function SmartNotes({
  tasks, ideas, reminders,
  onAddNote, onUpdateTask, onIdeaToTask, onDeleteIdea, onDeleteReminder,
}: Props) {
  const [activeType, setActiveType] = useState<NoteType>('aksiyon')
  const [input, setInput] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const pool = tasks.filter(t => !t.done && t.type === 'backlog')

  const handleAdd = () => {
    if (!input.trim()) return
    onAddNote(input.trim(), activeType)
    setInput('')
  }

  const placeholders: Record<NoteType, string> = {
    aksiyon: '+ Aksiyon ekle — havuza gider...',
    fikir:   '+ Fikir yaz — idea bank\'e gider...',
    takip:   '+ Takip notu — gözat listesine...',
  }

  return (
    <div>
      {/* Type selector */}
      <div className="flex gap-2 mb-3">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`flex-1 py-2 px-1 rounded-xl border text-center transition-all ${
              activeType === t.id
                ? 'border-blue-400 bg-blue-50'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className="text-sm mb-0.5">{t.icon}</div>
            <div className={`text-[10px] font-medium ${activeType === t.id ? 'text-blue-700' : 'text-stone-600'}`}>
              {t.label}
            </div>
            <div className={`text-[9px] ${activeType === t.id ? 'text-blue-400' : 'text-stone-400'}`}>
              {t.sub}
            </div>
          </button>
        ))}
      </div>

      {/* Content per type */}
      {activeType === 'aksiyon' && (
        <div>
          <p className="text-[10px] text-stone-400 pb-2">{pool.length} görev havuzda</p>
          {pool.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-4">Havuz boş!</p>
          )}
          {pool.map(t => (
            <div key={t.id} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-stone-100 mb-1.5">
              <span className="flex-1 text-[12px] text-stone-700 leading-snug">{t.title}</span>
              <button
                onClick={() => onUpdateTask(t.id, { date: todayStr, type: 'task' })}
                className="text-[10px] px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 whitespace-nowrap"
              >
                ☀️ Bugün
              </button>
            </div>
          ))}
        </div>
      )}

      {activeType === 'fikir' && (
        <div>
          <p className="text-[10px] text-stone-400 pb-2">{ideas.length} fikir stokta</p>
          {ideas.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-4">Henüz fikir yok — bir şeyler aklına gelince buraya yaz.</p>
          )}
          {ideas.map(n => {
            const cc = catColor(n.c)
            return (
              <div key={n.id} className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-stone-100 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: cc }} />
                <span className="flex-1 text-[12px] text-stone-700 leading-snug">{n.t}</span>
                <button onClick={() => onIdeaToTask(n.id)} className="text-[10px] px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 whitespace-nowrap">→ Aksiyon</button>
                <button onClick={() => onDeleteIdea(n.id)} className="text-[11px] text-stone-400 hover:text-red-400 px-1">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {activeType === 'takip' && (
        <div>
          <p className="text-[10px] text-stone-400 pb-2">{reminders.length} takip listede</p>
          {reminders.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-4">Gözat listesi boş.</p>
          )}
          {reminders.map(n => {
            const cc = catColor(n.c)
            return (
              <div key={n.id} className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-stone-100 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: cc }} />
                <span className="flex-1 text-[12px] text-stone-700 leading-snug">{n.t}</span>
                <button onClick={() => onDeleteReminder(n.id)} className="text-[11px] text-stone-400 hover:text-red-400 px-1">✕</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Input */}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder={placeholders[activeType]}
        className="w-full mt-2 p-2.5 text-[12px] bg-stone-50 border border-dashed border-stone-300 rounded-xl outline-none focus:border-blue-400 focus:bg-white text-stone-800 placeholder:text-stone-400 transition-colors"
      />
    </div>
  )
}

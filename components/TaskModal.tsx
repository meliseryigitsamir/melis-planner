'use client'

import { useState, useEffect } from 'react'
import type { Task, CustomCat } from '@/lib/types'
import { todayStr, addDays, isPast } from '@/lib/utils'
import { CATS_W, CATS_P } from '@/lib/constants'

interface Props {
  task: Task
  onSave: (id: number, updates: Partial<Task>) => void
  onDelete: (id: number) => void
  onClose: () => void
  customCats?: CustomCat[]
}

export default function TaskModal({ task, onSave, onDelete, onClose, customCats = [] }: Props) {
  const [title, setTitle] = useState(task.title)
  const [date, setDate] = useState(task.date ?? '')
  const [cat, setCat] = useState(task.cat)
  const [pool, setPool] = useState(task.pool)
  const [priority, setPriority] = useState(task.priority)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 10)
  }, [])

  const close = () => {
    setVisible(false)
    setTimeout(onClose, 280)
  }

  const save = () => {
    onSave(task.id, { title, date: date || null, priority, cat, pool })
    close()
  }

  const cats = pool === 'is' ? CATS_W : CATS_P
  const poolCustomCats = customCats.filter(c => c.pool === pool)
  const today = todayStr()

  return (
    <div
      onClick={e => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl px-5 pb-8 pt-2 shadow-xl transition-transform duration-[280ms] ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="w-8 h-0.5 bg-stone-300 rounded-full mx-auto mb-4" />
        <h3 className="text-sm font-medium text-stone-700 text-center mb-4">Görevi Düzenle</h3>

        {/* Title */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 outline-none focus:border-blue-400 resize-none mb-3"
          rows={2}
        />

        {/* Pool toggle */}
        <div className="flex gap-2 mb-3">
          {(['aile', 'is'] as const).map(p => (
            <button key={p} onClick={() => setPool(p)}
              className={`flex-1 text-xs py-2 rounded-xl border font-bold transition-all ${
                pool === p
                  ? p === 'aile' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-stone-200 text-stone-400'
              }`}>
              {p === 'aile' ? '👩‍👧 Kişisel' : '💼 İş'}
            </button>
          ))}
        </div>

        {/* Date + Priority + Category */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-[9px] font-medium text-stone-400 uppercase tracking-wider block mb-1">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-700 outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-[9px] font-medium text-stone-400 uppercase tracking-wider block mb-1">Öncelik</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Task['priority'])}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-700 outline-none"
            >
              <option value="">Normal</option>
              <option value="med">🟡 Orta</option>
              <option value="high">🔴 Yüksek</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-medium text-stone-400 uppercase tracking-wider block mb-1">Kategori</label>
            <select
              value={cat}
              onChange={e => setCat(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-700 outline-none"
            >
              {cats.map(c => <option key={c.n} value={c.n}>{c.n}</option>)}
              {poolCustomCats.length > 0 && poolCustomCats.map(c => <option key={c.n} value={c.n}>✨ {c.n}</option>)}
            </select>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          <button onClick={() => { onSave(task.id, { date: today, type: 'task' }); close() }}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-600">
            ☀️ Bugüne
          </button>
          {task.date && isPast(task.date) && (
            <button onClick={() => { onSave(task.id, { date: addDays(1), type: 'task' }); close() }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-600">
              📅 Yarına
            </button>
          )}
          <button onClick={() => { onSave(task.id, { date: null, type: 'backlog' }); close() }}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-600">
            📋 Havuza
          </button>
        </div>

        <button onClick={save}
          className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium mb-2 hover:bg-blue-600 active:scale-[.99] transition-all">
          Kaydet
        </button>
        <button onClick={() => { onDelete(task.id); close() }}
          className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-sm">
          Sil
        </button>
      </div>
    </div>
  )
}

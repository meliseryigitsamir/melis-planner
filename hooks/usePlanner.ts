'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PlannerState, Task, Note, Idea, Reminder, CheckIn, Pool, NoteType, ClientEntry, PipelineStage } from '@/lib/types'
import { loadState, saveState, loadCheckIn, saveCheckIn } from '@/lib/storage'
import { todayStr, detectPool, detectCat } from '@/lib/utils'

export type Hat = 'all' | 'aile' | 'is'

export function usePlanner() {
  const [state, setState] = useState<PlannerState>({
    tasks: [], notes: { aile: [], is: [] },
    ideas: [], reminders: [], completed: [], clients: [],
  })
  const [checkin, setCheckin] = useState<CheckIn | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [hat, setHat] = useState<Hat>('all')

  // Load from localStorage on mount
  useEffect(() => {
    setState(loadState())
    setCheckin(loadCheckIn())
    setHydrated(true)
  }, [])

  // Save on every state change
  useEffect(() => {
    if (hydrated) saveState(state)
  }, [state, hydrated])

  // ── TASKS ──────────────────────────────────────────────
  const addTask = useCallback((t: Omit<Task, 'id' | 'done'>) => {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, { ...t, id: Date.now(), done: false }],
    }))
  }, [])

  const toggleTask = useCallback((id: number) => {
    setState(prev => {
      const tasks = prev.tasks.map(t => {
        if (t.id !== id) return t
        const done = !t.done
        return { ...t, done }
      })
      const toggled = tasks.find(t => t.id === id)
      const completed = toggled?.done
        ? [...prev.completed, { title: toggled.title, doneAt: todayStr(), role: checkin?.role }]
        : prev.completed
      return { ...prev, tasks, completed: completed.slice(-200) }
    })
  }, [checkin])

  const updateTask = useCallback((id: number, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }))
  }, [])

  const deleteTask = useCallback((id: number) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))
  }, [])

  // ── CLIENTS / PIPELINE ────────────────────────────────
  const addClient = useCallback((client: Omit<ClientEntry, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      clients: [...(prev.clients ?? []), { ...client, id: Date.now(), createdAt: todayStr() }],
    }))
  }, [])

  const updateClient = useCallback((id: number, updates: Partial<ClientEntry>) => {
    setState(prev => ({
      ...prev,
      clients: (prev.clients ?? []).map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  }, [])

  const deleteClient = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      clients: (prev.clients ?? []).filter(c => c.id !== id),
    }))
  }, [])

  // ── SMART NOTES ────────────────────────────────────────
  const addSmartNote = useCallback((text: string, noteType: NoteType, preferredPool?: Pool) => {
    const pool = detectPool(text) ?? preferredPool ?? 'aile'
    const cat = detectCat(text, pool)

    if (noteType === 'aksiyon') {
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, {
          id: Date.now(), title: text, date: null,
          cat: cat.n, pool, type: 'backlog', priority: 'med', done: false,
        }],
      }))
    } else if (noteType === 'fikir') {
      setState(prev => ({
        ...prev,
        ideas: [...prev.ideas, { id: Date.now(), t: text, c: cat.n, createdAt: new Date().toISOString() }],
      }))
    } else {
      setState(prev => ({
        ...prev,
        reminders: [...prev.reminders, { id: Date.now(), t: text, c: cat.n, createdAt: new Date().toISOString() }],
      }))
    }
  }, [])

  const ideaToTask = useCallback((id: number) => {
    setState(prev => {
      const idea = prev.ideas.find(i => i.id === id)
      if (!idea) return prev
      const pool = detectPool(idea.t) ?? 'aile'
      return {
        ...prev,
        ideas: prev.ideas.filter(i => i.id !== id),
        tasks: [...prev.tasks, {
          id: Date.now(), title: idea.t, date: null,
          cat: idea.c, pool, type: 'backlog', priority: 'med', done: false,
        }],
      }
    })
  }, [])

  const deleteIdea = useCallback((id: number) => {
    setState(prev => ({ ...prev, ideas: prev.ideas.filter(i => i.id !== id) }))
  }, [])

  const deleteReminder = useCallback((id: number) => {
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }))
  }, [])

  // ── CHECK-IN ───────────────────────────────────────────
  const doCheckIn = useCallback((ci: CheckIn) => {
    setCheckin(ci)
    saveCheckIn(ci)
  }, [])

  const resetCheckIn = useCallback(() => {
    setCheckin(null)
  }, [])

  return {
    state, checkin, hydrated, hat, setHat,
    addTask, toggleTask, updateTask, deleteTask,
    addClient, updateClient, deleteClient,
    addSmartNote, ideaToTask, deleteIdea, deleteReminder,
    doCheckIn, resetCheckIn,
  }
}

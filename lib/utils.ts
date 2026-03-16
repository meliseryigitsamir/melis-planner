import { MONTHS_S, ALL_CATS, CATS_W, CATS_P } from './constants'
import type { Task, Pool } from './types'

// ── DATE ────────────────────────────────────────────────
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayStr(): string {
  return localDateStr(new Date())
}

export function dateToLocalStr(d: Date): string {
  return localDateStr(d)
}

export function isPast(d: string | null): boolean {
  return !!d && d < todayStr()
}

export function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

export function fmtDate(ds: string | null): string {
  if (!ds) return ''
  if (ds === todayStr()) return 'Bugün'
  if (ds === addDays(1)) return 'Yarın'
  if (isPast(ds)) {
    const diff = Math.ceil(
      (new Date(todayStr() + 'T00:00:00').getTime() - new Date(ds + 'T00:00:00').getTime()) / 86400000
    )
    return `${diff}g geç`
  }
  const d = new Date(ds + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`
}

// ── URGENCY ─────────────────────────────────────────────
export function urgencyScore(t: Task): number {
  if (t.done) return 0
  let s = 0
  if (t.priority === 'high') s += 30
  if (t.priority === 'med') s += 10
  if (t.date) {
    const diff = Math.ceil(
      (new Date(t.date + 'T00:00:00').getTime() - new Date(todayStr() + 'T00:00:00').getTime()) / 86400000
    )
    if (diff < 0) s += 50
    else if (diff === 0) s += 40
    else if (diff === 1) s += 20
    else if (diff <= 7) s += 10
  }
  return s
}

// ── CATEGORIES ──────────────────────────────────────────
export function catColor(name: string): string {
  return ALL_CATS.find(c => c.n === name)?.c ?? '#94a3b8'
}

// ── AUTO DETECT ─────────────────────────────────────────
const WORK_KW = ['lal','lâl','yztd','joyce','tbb','ders','ödev','phd','tez','makale','iau','bau','sunum','toplantı','teklif','müşteri','linkedin','podcast','bildiri','sempozyum']
const PERS_KW = ['beliz','doktor','randevu','market','spor','babam','aile','ev','eczane','barış','anne']

const WORK_PAIRS: string[][] = [
  ['lal','lâl','hilal','teklif','scrolli','fatura'],
  ['bau','yeterlik','tez','makale','ömer'],
  ['iau','iaü','ders','ödev'],
  ['yztd','joyce'],
  ['linkedin','yazı','hbr','forbes','podcast'],
  ['network','bağlantı'],
  ['başvuru','bildiri','sempozyum'],
  [],
]

const PERS_PAIRS: string[][] = [
  ['melis bau','yeterlik'],
  ['melis iau','ders'],
  ['doktor','randevu','eczane','kitap','spor','kuaför'],
  ['melis iş','toplantı'],
  ['beliz doktor','beliz diş'],
  ['beliz okul','karne'],
  ['beliz'],
  ['barış'],
  ['baba','babam'],
  ['anne','aile','ikea','ev'],
  ['fatura','ödeme'],
  ['seyahat','uçuş'],
  ['ramazan'],
  ['bayram'],
  [],
]

export function detectPool(text: string): Pool | null {
  const low = text.toLowerCase()
  let ws = 0, ps = 0
  WORK_KW.forEach(k => { if (low.includes(k)) ws += k.length })
  PERS_KW.forEach(k => { if (low.includes(k)) ps += k.length })
  return ws > ps ? 'is' : ps > ws ? 'aile' : null
}

export function detectCat(text: string, pool: Pool): { n: string; c: string } {
  const low = text.toLowerCase()
  const cats = pool === 'is' ? CATS_W : CATS_P
  const pairs = pool === 'is' ? WORK_PAIRS : PERS_PAIRS
  let best: { n: string; c: string } | null = null
  let bestScore = 0
  cats.forEach((cat, i) => {
    const kws = pairs[i] ?? []
    kws.forEach(k => {
      if (low.includes(k) && k.length > bestScore) {
        bestScore = k.length
        best = cat
      }
    })
  })
  return best ?? cats[cats.length - 1]
}

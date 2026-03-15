'use client'

import { useState } from 'react'
import type { Role, Energy, CheckIn } from '@/lib/types'
import { ROLES, ENERGIES, MONTHS, DAYS_TR } from '@/lib/constants'

interface Props {
  onComplete: (ci: CheckIn) => void
}

export default function CheckInScreen({ onComplete }: Props) {
  const [role, setRole] = useState<Role | null>(null)
  const [energy, setEnergy] = useState<Energy | null>(null)

  const d = new Date()
  const hr = d.getHours()
  const greet = hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : 'İyi akşamlar'
  const dateStr = `${DAYS_TR[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`

  const handleStart = () => {
    if (!role || !energy) return
    onComplete({
      date: new Date().toISOString().split('T')[0],
      role,
      energy,
    })
  }

  return (
    <div className="flex flex-col flex-1 p-7 bg-white">
      <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">{dateStr}</p>
      <h1 className="text-2xl font-medium text-stone-800 mb-1">{greet}, Melis.</h1>
      <p className="text-sm text-stone-500 mb-7">Bugün hangi şapkayı takıyorsun?</p>

      {/* Rol */}
      <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-2">Rol</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`text-left p-3 rounded-xl border transition-all ${
              role === r.id
                ? 'border-blue-400 bg-blue-50'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <span className="text-xl block mb-1">{r.icon}</span>
            <span className={`text-sm font-medium block ${role === r.id ? 'text-blue-700' : 'text-stone-700'}`}>
              {r.name}
            </span>
            <span className={`text-[10px] leading-tight block mt-0.5 ${role === r.id ? 'text-blue-500' : 'text-stone-400'}`}>
              {r.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Enerji */}
      <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-2">Enerji</p>
      <div className="flex gap-2 mb-7">
        {ENERGIES.map(e => (
          <button
            key={e.id}
            onClick={() => setEnergy(e.id)}
            className={`flex-1 p-3 rounded-xl border text-center transition-all ${
              energy === e.id
                ? 'border-blue-400 bg-blue-50'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300'
            }`}
          >
            <div className="text-lg mb-1">{e.icon}</div>
            <div className={`text-[11px] font-medium ${energy === e.id ? 'text-blue-700' : 'text-stone-700'}`}>
              {e.name}
            </div>
            <div className={`text-[9px] mt-0.5 leading-tight ${energy === e.id ? 'text-blue-500' : 'text-stone-400'}`}>
              {e.hint}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={!role || !energy}
        className={`mt-auto w-full py-3 rounded-xl text-sm font-medium transition-all ${
          role && energy
            ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.99]'
            : 'bg-stone-100 text-stone-300 cursor-not-allowed'
        }`}
      >
        Güne Başla →
      </button>
    </div>
  )
}

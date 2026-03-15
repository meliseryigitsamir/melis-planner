import type { Nudge } from '@/lib/types'

const styles = {
  warn:   'bg-amber-50 border-amber-200',
  info:   'bg-blue-50 border-blue-200',
  danger: 'bg-red-50 border-red-200',
}
const labelStyles = {
  warn:   'text-amber-600',
  info:   'text-blue-600',
  danger: 'text-red-600',
}

export default function NudgeCard({ nudge }: { nudge: Nudge }) {
  return (
    <div className={`flex gap-2.5 items-start p-2.5 rounded-xl border mb-2 ${styles[nudge.type]}`}>
      <span className="text-sm flex-shrink-0 mt-0.5">{nudge.icon}</span>
      <div>
        <p className={`text-[9px] font-semibold uppercase tracking-wider mb-0.5 ${labelStyles[nudge.type]}`}>
          {nudge.label}
        </p>
        <p className="text-[11px] text-stone-700 leading-relaxed">{nudge.text}</p>
      </div>
    </div>
  )
}

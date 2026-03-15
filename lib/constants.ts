import type { Role, Energy, PipelineStage } from './types'

export const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
export const MONTHS_S = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
export const DAYS_TR = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi']
export const DAYS_S = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']

export const CATS_W = [
  { n: 'Lâl Project',       c: '#f87171' },
  { n: 'PhD - BAU',         c: '#3b82f6' },
  { n: 'İAÜ Derslik',       c: '#8b5cf6' },
  { n: 'YZTD',              c: '#14b8a6' },
  { n: 'İçerik / Yazı',     c: '#f59e0b' },
  { n: 'Network',           c: '#60a5fa' },
  { n: 'Başvuru / Gönderi', c: '#94a3b8' },
  { n: 'Genel',             c: '#94a3b8' },
]

export const CATS_P = [
  { n: 'Melis BAU',     c: '#60a5fa' },
  { n: 'Melis İAÜ',    c: '#a78bfa' },
  { n: 'Melis Kişisel', c: '#c084fc' },
  { n: 'Melis İş',     c: '#8b5cf6' },
  { n: 'Beliz Sağlık', c: '#fb923c' },
  { n: 'Beliz Okul',   c: '#f59e0b' },
  { n: 'Beliz Gelişim',c: '#fbbf24' },
  { n: 'Melis & Barış',c: '#34d399' },
  { n: 'Baba',         c: '#f472b6' },
  { n: 'Aile Genel',   c: '#fb7185' },
  { n: 'Finans',       c: '#fbbf24' },
  { n: 'Seyahat',      c: '#38bdf8' },
  { n: 'Dini',         c: '#86efac' },
  { n: 'Tatil/Bayram', c: '#f87171' },
  { n: 'Genel',        c: '#94a3b8' },
]

export const ALL_CATS = [...CATS_W, ...CATS_P]

export const ROLE_CATS: Record<Role, string[] | null> = {
  anne:    ['Melis Kişisel','Beliz Sağlık','Beliz Okul','Beliz Gelişim','Melis & Barış','Baba','Aile Genel','Finans','Seyahat','Dini','Tatil/Bayram','Genel'],
  akademi: ['PhD - BAU','Melis BAU','İAÜ Derslik','Melis İAÜ','Başvuru / Gönderi','İçerik / Yazı'],
  girisim: ['Lâl Project','YZTD','Network','İçerik / Yazı','Başvuru / Gönderi'],
  hepsi:   null,
}

export const ROLES: { id: Role; icon: string; name: string; desc: string }[] = [
  { id: 'anne',    icon: '👩‍👧', name: 'Anne',        desc: 'Beliz, aile, ev, kişisel' },
  { id: 'akademi', icon: '🎓',  name: 'Akademisyen', desc: 'PhD, ders, yeterlik' },
  { id: 'girisim', icon: '💼',  name: 'Girişimci',   desc: 'Lâl, danışmanlık, ağ' },
  { id: 'hepsi',   icon: '🌀',  name: 'Hepsi',       desc: 'Tam görünüm' },
]

export const ENERGIES: { id: Energy; icon: string; name: string; hint: string }[] = [
  { id: 'high', icon: '⚡',  name: 'Yüksek', hint: 'Full pipeline' },
  { id: 'mid',  icon: '🌤️', name: 'Orta',   hint: 'Bugün + kritik' },
  { id: 'low',  icon: '🌙',  name: 'Düşük',  hint: 'Sadece kritik' },
]

// ── PIPELINE STAGE CONFIG ────────────────────────────────
export const PIPELINE_STAGES: { id: PipelineStage; label: string; icon: string; color: string; bg: string; border: string }[] = [
  { id: 'lead',       label: 'Lead',        icon: '🎯', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  { id: 'teklif',     label: 'Teklif',      icon: '📄', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  { id: 'aktif',      label: 'Aktif Proje', icon: '🚀', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'tamamlandi', label: 'Tamamlandı',  icon: '✅', color: 'text-stone-500',   bg: 'bg-stone-50',   border: 'border-stone-200' },
]

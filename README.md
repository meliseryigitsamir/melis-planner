# Melis Planner

Rol + enerji tabanlı kişisel planner. Behavioral nudge'lar, haftalık dağılım grafiği ve akıllı notlar içerir.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` aç.

## Vercel Deploy

```bash
npm i -g vercel
vercel
```

## Klasör Yapısı

```
app/
  page.tsx          ← Ana sayfa (tüm view'lar burada)
  layout.tsx        ← HTML wrapper
  globals.css       ← Tailwind base

components/
  CheckIn.tsx       ← Sabah check-in ekranı
  TaskCard.tsx      ← Görev kartı
  TaskModal.tsx     ← Görev düzenleme (bottom sheet)
  NudgeCard.tsx     ← Behavioral uyarı kartı
  DistChart.tsx     ← Haftalık dağılım grafiği
  SmartNotes.tsx    ← Akıllı notlar (aksiyon/fikir/takip)

hooks/
  usePlanner.ts     ← Ana state yönetimi

lib/
  types.ts          ← TypeScript tipleri
  constants.ts      ← Kategoriler, roller, sabit data
  utils.ts          ← Tarih, kategori, detect yardımcıları
  storage.ts        ← localStorage interface (Supabase'e geçince sadece bu dosya değişir)
  nudges.ts         ← Behavioral engine
  filter.ts         ← Rol + enerji bazlı filtreleme
```

## Supabase'e Geçiş

Hazır olduğunda sadece `lib/storage.ts` dosyasını değiştirirsin.  
`loadState()` ve `saveState()` fonksiyonlarını Supabase client'a bağla — component'lar hiç dokunulmaz.

## Veriler

localStorage key: `melis_planner_2026_v5`  
Check-in key: `melis_ci_v1`  
Check-in history: `melis_ci_history`  

💾 Header'daki disk ikonuna tıklayınca JSON export alırsın.

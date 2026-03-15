import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f5f4f1',
}

export const metadata: Metadata = {
  title: 'Melis Planner',
  description: 'Kişisel planner — rol + enerji tabanlı görev yönetimi',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Planner' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-stone-100 min-h-screen antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}

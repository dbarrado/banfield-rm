import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow',
})

export const metadata: Metadata = {
  title: 'BanfieldRM',
  description: 'Sistema de gestión — Filial Banfield Ramos Mejía',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'BanfieldRM' },
}

export const viewport: Viewport = {
  themeColor: '#00843D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${barlowCondensed.variable}`}>
      <body className={`min-h-full antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}

import { Sidebar } from '@/components/layout/sidebar'
import { DemoBanner } from '@/components/layout/demo-banner'
import { TopBar } from '@/components/layout/top-bar'
import { ClubTheme } from '@/components/layout/club-theme'
import { DataProvider } from '@/components/layout/data-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClubTheme />
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-16 pb-20 md:pb-0 overflow-x-hidden">
        <DemoBanner />
        <TopBar />
        <DataProvider>{children}</DataProvider>
      </main>
    </div>
  )
}

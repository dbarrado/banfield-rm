import { Sidebar } from '@/components/layout/sidebar'
import { DemoBanner } from '@/components/layout/demo-banner'
import { TopBar } from '@/components/layout/top-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:ml-16 pb-20 md:pb-0">
        <DemoBanner />
        <TopBar />
        {children}
      </main>
    </div>
  )
}

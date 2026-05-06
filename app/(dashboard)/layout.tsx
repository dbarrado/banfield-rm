import { Sidebar } from '@/components/layout/sidebar'
import { DemoBanner } from '@/components/layout/demo-banner'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:ml-16 pb-20 md:pb-0">
        {DEMO_MODE && <DemoBanner />}
        {children}
      </main>
    </div>
  )
}

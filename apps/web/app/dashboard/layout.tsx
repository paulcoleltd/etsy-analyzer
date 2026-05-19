import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#eef1f8' }}>
      <Sidebar />
      <TopBar />
      <main className="ml-56 pt-14">
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  )
}

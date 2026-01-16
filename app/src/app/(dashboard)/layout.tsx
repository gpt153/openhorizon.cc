import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

// Force dynamic rendering to avoid Clerk pre-rendering issues during build
export const dynamic = 'force-dynamic'

// Auth disabled - public access
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  )
}

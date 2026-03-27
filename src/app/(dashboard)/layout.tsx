import Sidebar from '@/components/ui/Sidebar'
import Navbar from '@/components/ui/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: '1400px', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

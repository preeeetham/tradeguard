'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, LayoutDashboard, CheckSquare, Calendar, BookOpen, BarChart2, Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out. See you next session!')
    router.push('/login')
  }

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px', padding: '4px 8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #F0B90B, #FFD84D)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(240,185,11,0.25)',
          flexShrink: 0,
        }}>
          <TrendingUp size={22} color="#0A0A00" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Trade<span style={{ color: 'var(--gold)' }}>Guard</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Trading Discipline
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`nav-link ${active ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Checklist' && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--gold)',
                  color: '#0A0A00',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 7px',
                }}>GO</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} className="nav-link" style={{
        width: '100%',
        background: 'none',
        border: 'none',
        color: 'var(--danger)',
        marginTop: '8px',
        opacity: 0.8,
      }}>
        <LogOut size={18} />
        <span>Log Out</span>
      </button>

      {/* Version */}
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '16px', opacity: 0.5 }}>
        v1.0 · IST Timezone
      </div>
    </aside>
  )
}

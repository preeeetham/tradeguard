'use client'

import { useEffect, useState } from 'react'
import { Clock, Wifi } from 'lucide-react'
import { getCurrentSessionIST, formatTimeIST } from '@/lib/utils'

const sessionColors: Record<string, { bg: string; color: string; border: string }> = {
  London: { bg: 'rgba(240,185,11,0.12)', color: '#F0B90B', border: 'rgba(240,185,11,0.3)' },
  'New York': { bg: 'rgba(0,200,83,0.12)', color: '#00C853', border: 'rgba(0,200,83,0.3)' },
  Asian: { bg: 'rgba(100,149,237,0.12)', color: '#6495ED', border: 'rgba(100,149,237,0.3)' },
  'Off-Hours': { bg: 'rgba(138,138,154,0.1)', color: '#8A8A9A', border: 'rgba(138,138,154,0.2)' },
}

export default function Navbar() {
  const [time, setTime] = useState('')
  const [session, setSession] = useState(getCurrentSessionIST())

  useEffect(() => {
    function tick() {
      setTime(formatTimeIST())
      setSession(getCurrentSessionIST())
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  const sessionStyle = sessionColors[session.name] || sessionColors['Off-Hours']

  return (
    <header style={{
      height: '64px',
      background: 'rgba(224, 229, 236, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 28px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>

      {/* News reminder */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: 'var(--warning)',
        background: 'rgba(255,179,0,0.08)',
        padding: '6px 12px',
        borderRadius: '100px',
        border: '1px solid rgba(255,179,0,0.2)',
      }}>
        <Wifi size={12} />
        <span>Check Forex Factory before trading</span>
      </div>

      {/* Session badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '100px',
        background: sessionStyle.bg,
        border: `1px solid ${sessionStyle.border}`,
        fontSize: '13px',
        fontWeight: '600',
        color: sessionStyle.color,
        boxShadow: `var(--clay-shadow-sm)`,
        ...(session.isActive ? {} : {}),
      }} className={session.isActive ? 'pulse-gold' : ''}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: sessionStyle.color,
          flexShrink: 0,
          boxShadow: session.isActive ? `0 0 6px ${sessionStyle.color}` : 'none',
        }} />
        <span>{session.name}</span>
        {session.isActive && session.istStart && (
          <span style={{ opacity: 0.7, fontWeight: 400, fontSize: '11px' }}>
            {session.istStart}–{session.istEnd} IST
          </span>
        )}
      </div>

      {/* IST Clock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: '100px',
        background: 'rgba(240,185,11,0.08)',
        border: '1px solid rgba(240,185,11,0.15)',
        fontSize: '14px',
        fontWeight: '700',
        color: 'var(--gold)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <Clock size={13} />
        <span>{time} IST</span>
      </div>
    </header>
  )
}

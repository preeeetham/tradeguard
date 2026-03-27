'use client'

import { ReactNode } from 'react'
import { TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ label, value, sub, icon, color = 'var(--gold)', trend }: StatCardProps) {
  return (
    <div className="clay-card" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: color,
        opacity: 0.04,
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          boxShadow: 'var(--clay-shadow-sm)',
        }}>
          {icon}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '28px', fontWeight: '800', color, letterSpacing: '-0.5px', lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {trend === 'down' && <TrendingDown size={12} style={{ color: 'var(--danger)' }} />}
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

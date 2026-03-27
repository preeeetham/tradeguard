'use client'

import { Trade } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface RecentTradesProps {
  trades: Trade[]
}

const resultColors: Record<string, { color: string; bg: string; border: string }> = {
  Win: { color: 'var(--success)', bg: 'rgba(0,200,83,0.1)', border: 'rgba(0,200,83,0.2)' },
  Loss: { color: 'var(--danger)', bg: 'rgba(255,61,0,0.1)', border: 'rgba(255,61,0,0.2)' },
  Breakeven: { color: 'var(--warning)', bg: 'rgba(255,179,0,0.1)', border: 'rgba(255,179,0,0.2)' },
  Pending: { color: 'var(--text-secondary)', bg: 'rgba(113,128,150,0.1)', border: 'rgba(113,128,150,0.2)' },
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  if (!trades.length) return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
      No trades yet. Complete a checklist to log your first trade.
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="clay-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Instrument</th>
            <th>Direction</th>
            <th>Model</th>
            <th>Session</th>
            <th>Result</th>
            <th>PnL</th>
            <th>R:R</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 5).map((trade) => {
            const res = resultColors[trade.result] || resultColors.Pending
            return (
              <tr key={trade.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {new Date(trade.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td style={{ fontWeight: '600', color: trade.instrument === 'XAU/USD' ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {trade.instrument}
                </td>
                <td>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: trade.direction === 'Long' ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {trade.direction === 'Long' ? '↑' : '↓'} {trade.direction}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{trade.model}</td>
                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{trade.session}</td>
                <td>
                  <span className="clay-tag" style={{ background: res.bg, color: res.color, border: `1px solid ${res.border}` }}>
                    {trade.result === 'Win' ? '✓' : trade.result === 'Loss' ? '✗' : '–'} {trade.result}
                  </span>
                </td>
                <td style={{ fontWeight: '700', color: trade.pnl > 0 ? 'var(--success)' : trade.pnl < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                </td>
                <td style={{ color: 'var(--gold)', fontWeight: '600' }}>
                  {trade.rr_achieved !== null ? `${trade.rr_achieved}R` : '–'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

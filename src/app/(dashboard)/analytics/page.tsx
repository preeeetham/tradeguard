/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trade } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, CartesianGrid,
} from 'recharts'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{children}</h2>
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="clay-card" style={{ padding: '24px' }}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('date', { ascending: true })
      setTrades(data || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closed = trades.filter(t => t.result !== 'Pending')
  const wins = closed.filter(t => t.result === 'Win')
  const losses = closed.filter(t => t.result === 'Loss')

  // 1. Cumulative PnL
  let cum = 0
  const pnlCurve = trades.map(t => {
    cum += t.pnl || 0
    return { date: t.date, pnl: Math.round(cum * 100) / 100, trade: t.instrument }
  })

  // 2. Win rate by model
  const modelData = ['Star', 'Engulf'].map(m => {
    const mt = closed.filter(t => t.model === m)
    const mw = mt.filter(t => t.result === 'Win')
    const avgRR = mt.filter(t => t.rr_achieved).reduce((s, t) => s + (t.rr_achieved || 0), 0) / (mw.length || 1)
    return { model: m, trades: mt.length, winRate: mt.length > 0 ? Math.round(mw.length / mt.length * 100) : 0, avgRR: Math.round(avgRR * 10) / 10 }
  })

  // 3. Win rate by session
  const sessionData = ['London', 'New York', 'Asian'].map(s => {
    const st = closed.filter(t => t.session === s)
    const sw = st.filter(t => t.result === 'Win')
    return { session: s, trades: st.length, winRate: st.length > 0 ? Math.round(sw.length / st.length * 100) : 0 }
  })

  // 4. Win rate by instrument
  const instruments = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'Other']
  const instrData = instruments.map(inst => {
    const it = closed.filter(t => t.instrument === inst)
    const iw = it.filter(t => t.result === 'Win')
    return { instrument: inst.replace('/USD', ''), trades: it.length, winRate: it.length > 0 ? Math.round(iw.length / it.length * 100) : 0 }
  }).filter(d => d.trades > 0)

  // 5. Rule compliance over time (weekly)
  const weeklyCompliance: { week: string; pct: number }[] = []
  if (trades.length > 0) {
    const weeks: Record<string, { total: number; compliant: number }> = {}
    trades.forEach(t => {
      const d = new Date(t.date)
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toISOString().split('T')[0]
      if (!weeks[key]) weeks[key] = { total: 0, compliant: 0 }
      weeks[key].total++
      if (t.checklist_completed) weeks[key].compliant++
    })
    Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).forEach(([k, v]) => {
      weeklyCompliance.push({ week: k.slice(5), pct: Math.round(v.compliant / v.total * 100) })
    })
  }

  // 6. Confluence vs win rate
  const confluenceMap: Record<number, { total: number; wins: number }> = {}
  closed.forEach(t => {
    const c = t.confluences || 0
    if (!confluenceMap[c]) confluenceMap[c] = { total: 0, wins: 0 }
    confluenceMap[c].total++
    if (t.result === 'Win') confluenceMap[c].wins++
  })
  const confData = Object.entries(confluenceMap).sort(([a], [b]) => Number(a) - Number(b)).map(([c, d]) => ({
    confluences: `${c} conf.`,
    winRate: d.total > 0 ? Math.round(d.wins / d.total * 100) : 0,
    trades: d.total,
  }))

  // Stats
  const totalPnL = trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const winRR = wins.filter(t => t.rr_achieved).reduce((s, t) => s + (t.rr_achieved || 0), 0) / (wins.length || 1)
  const lossRR = losses.filter(t => t.rr_achieved).reduce((s, t) => s + (t.rr_achieved || 0), 0) / (losses.length || 1)
  const bestTrade = closed.reduce((best, t) => t.pnl > (best?.pnl || -Infinity) ? t : best, null as Trade | null)
  const worstTrade = closed.reduce((worst, t) => t.pnl < (worst?.pnl || Infinity) ? t : worst, null as Trade | null)
  const profitFactor = Math.abs(losses.reduce((s, t) => s + t.pnl, 0)) > 0
    ? Math.round(wins.reduce((s, t) => s + t.pnl, 0) / Math.abs(losses.reduce((s, t) => s + t.pnl, 0)) * 100) / 100
    : 0
  const compliance = trades.length > 0 ? Math.round(trades.filter(t => t.checklist_completed).length / trades.length * 100) : 0
  const starWR = (() => { const st = closed.filter(t => t.model === 'Star'); return st.length > 0 ? Math.round(st.filter(t => t.result === 'Win').length / st.length * 100) : 0 })()
  const engulfWR = (() => { const et = closed.filter(t => t.model === 'Engulf'); return et.length > 0 ? Math.round(et.filter(t => t.result === 'Win').length / et.length * 100) : 0 })()

  // Max drawdown
  let peak = 0; let dd = 0; let cumSum = 0
  trades.forEach(t => { cumSum += t.pnl || 0; if (cumSum > peak) peak = cumSum; const d = peak - cumSum; if (d > dd) dd = d })

  // Streaks
  let bestStreak = 0; let curWStreak = 0; let worstStreak = 0; let curLStreak = 0
  closed.forEach(t => {
    if (t.result === 'Win') { curWStreak++; worstStreak = 0; if (curWStreak > bestStreak) bestStreak = curWStreak }
    else { curLStreak++; curWStreak = 0; if (curLStreak > worstStreak) worstStreak = curLStreak }
  })

  const statItems = [
    { label: 'Total Trades', value: trades.length, color: 'var(--gold)' },
    { label: 'Win Rate', value: `${closed.length > 0 ? Math.round(wins.length / closed.length * 100) : 0}%`, color: 'var(--success)' },
    { label: 'Loss Rate', value: `${closed.length > 0 ? Math.round(losses.length / closed.length * 100) : 0}%`, color: 'var(--danger)' },
    { label: 'Avg R:R (Won)', value: `${Math.round(winRR * 10) / 10}R`, color: 'var(--success)' },
    { label: 'Avg R:R (Lost)', value: `${Math.round(lossRR * 10) / 10}R`, color: 'var(--danger)' },
    { label: 'Best Trade', value: bestTrade ? formatCurrency(bestTrade.pnl) : '–', color: 'var(--success)' },
    { label: 'Worst Trade', value: worstTrade ? formatCurrency(worstTrade.pnl) : '–', color: 'var(--danger)' },
    { label: 'Profit Factor', value: profitFactor > 0 ? profitFactor : '–', color: profitFactor >= 1 ? 'var(--success)' : 'var(--danger)' },
    { label: 'Max Drawdown', value: formatCurrency(dd), color: 'var(--danger)' },
    { label: 'Best Win Streak', value: `${bestStreak} trades`, color: 'var(--warning)' },
    { label: 'Longest Loss Streak', value: `${worstStreak} trades`, color: 'var(--danger)' },
    { label: 'Compliance %', value: `${compliance}%`, color: compliance >= 80 ? 'var(--success)' : 'var(--warning)' },
    { label: 'Star Win Rate', value: `${starWR}%`, color: 'var(--gold)' },
    { label: 'Engulf Win Rate', value: `${engulfWR}%`, color: 'var(--gold)' },
    { label: 'Total PnL', value: formatCurrency(totalPnL), color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)' },
  ]

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading analytics…</div>

  const tooltipStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--clay-shadow)' }

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800' }}>📊 Analytics</h1>

      {/* Stats Panel */}
      <div className="clay-card" style={{ padding: '24px' }}>
        <SectionTitle>Performance Summary</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {statItems.map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-input)', borderRadius: '14px', padding: '14px', boxShadow: 'var(--clay-shadow-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color }}>{String(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 1: Cumulative PnL */}
      <ChartCard title="📈 Cumulative PnL Curve">
        {pnlCurve.length === 0
          ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No trades to display</div>
          : <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pnlCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(v), 'PnL']} />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.1)" />
              <Line type="monotone" dataKey="pnl" stroke="#F0B90B" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#F0B90B' }} />
            </LineChart>
          </ResponsiveContainer>}
      </ChartCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Chart 2: Win Rate by Model */}
        <ChartCard title="⭐ Win Rate by Model">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modelData} barSize={40}>
              <XAxis dataKey="model" tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [n === 'winRate' ? `${v}%` : v, n === 'winRate' ? 'Win Rate' : 'Trades']} />
              <Bar dataKey="winRate" radius={[8, 8, 0, 0]} name="winRate">
                {modelData.map((_, i) => <Cell key={i} fill={i === 0 ? '#F0B90B' : '#6495ED'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px' }}>
            {modelData.map(m => (
              <div key={m.model} style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{m.model}</strong>: {m.trades} trades · {m.winRate}% WR · avg {m.avgRR}R
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Chart 3: Win Rate by Session */}
        <ChartCard title="🌍 Win Rate by Session">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sessionData} barSize={40}>
              <XAxis dataKey="session" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
              <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
                {sessionData.map((_, i) => <Cell key={i} fill={['#F0B90B', '#00C853', '#6495ED'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4: Win Rate by Instrument */}
        <ChartCard title="💰 Win Rate by Instrument">
          {instrData.length === 0
            ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px', fontSize: '14px' }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
              <BarChart data={instrData} barSize={36}>
                <XAxis dataKey="instrument" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
                  {instrData.map((d, i) => <Cell key={i} fill={d.instrument === 'XAU' ? '#F0B90B' : '#6495ED'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
        </ChartCard>

        {/* Chart 5: Rule Compliance */}
        <ChartCard title="🛡 Rule Compliance Over Time">
          {weeklyCompliance.length === 0
            ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px', fontSize: '14px' }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyCompliance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#718096', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Compliance']} />
                <ReferenceLine y={100} stroke="rgba(0,200,83,0.4)" strokeDasharray="4 4" label={{ value: 'Target', fill: '#00C853', fontSize: 11 }} />
                <Line type="monotone" dataKey="pct" stroke="#00C853" strokeWidth={2.5} dot={{ r: 4, fill: '#00C853' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>}
        </ChartCard>
      </div>

      {/* Chart 6: Confluence vs Win Rate */}
      <ChartCard title="🔗 Confluences vs Win Rate">
        {confData.length === 0
          ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px', fontSize: '14px' }}>No data yet — complete some checklists first</div>
          : <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confData} barSize={50}>
              <XAxis dataKey="confluences" tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [n === 'winRate' ? `${v}%` : v, n === 'winRate' ? 'Win Rate' : 'Trades']} />
              <Bar dataKey="winRate" radius={[8, 8, 0, 0]} name="winRate">
                {confData.map((d, i) => <Cell key={i} fill={d.winRate >= 60 ? '#00C853' : d.winRate >= 40 ? '#F0B90B' : '#FF3D00'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>}
      </ChartCard>
    </div>
  )
}

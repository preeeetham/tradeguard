/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trade, Journal, Profile } from '@/types'
import { getCurrentSessionIST, formatCurrency } from '@/lib/utils'
import StatCard from '@/components/dashboard/StatCard'
import RecentTrades from '@/components/dashboard/RecentTrades'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  TrendingUp, Target, DollarSign, Zap, Shield, Award,
  ChevronRight, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [journal, setJournal] = useState<Journal | null>(null)
  const [loading, setLoading] = useState(true)
  const [preMarketOpen, setPreMarketOpen] = useState(false)
  const session = getCurrentSessionIST()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: tradeData }, { data: journalData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('journal').select('*').eq('user_id', user.id).eq('date', new Date().toISOString().split('T')[0]).single(),
      ])

      setProfile(prof)
      setTrades(tradeData || [])
      setJournal(journalData)
      setLoading(false)
    }
    load()

    // Pre-market popup check at 13:00 IST
    const now = new Date()
    const istH = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }))
    const istM = parseInt(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit', hour12: false }))
    const total = istH * 60 + istM
    if (total >= 775 && total <= 790) setPreMarketOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Computed stats
  const today = new Date().toISOString().split('T')[0]
  const todayTrades = trades.filter(t => t.date === today)
  const last30 = trades.filter(t => {
    const d = new Date(t.date)
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    return d >= cutoff && t.result !== 'Pending'
  })
  const wins30 = last30.filter(t => t.result === 'Win').length
  const winRate30 = last30.length > 0 ? Math.round((wins30 / last30.length) * 100) : 0

  const monthStart = new Date(); monthStart.setDate(1)
  const monthTrades = trades.filter(t => new Date(t.date) >= monthStart)
  const monthPnL = monthTrades.reduce((s, t) => s + (t.pnl || 0), 0)

  const completed = trades.filter(t => t.checklist_completed && t.result !== 'Pending')
  const compliancePct = trades.length > 0 ? Math.round((trades.filter(t => t.checklist_completed).length / trades.length) * 100) : 0

  const closedTrades = trades.filter(t => t.result !== 'Pending' && t.rr_achieved !== null)
  const avgRR = closedTrades.length > 0
    ? Math.round(closedTrades.reduce((s, t) => s + (t.rr_achieved || 0), 0) / closedTrades.length * 10) / 10
    : 0

  // Streak: consecutive wins from most recent
  let streak = 0
  for (const t of trades) {
    if (t.result === 'Win') streak++
    else if (t.result === 'Loss') break
  }

  // Weekly PnL chart (last 7 days)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().split('T')[0]
    const dayTrades = trades.filter(t => t.date === ds)
    const pnl = dayTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      pnl: Math.round(pnl * 100) / 100,
    }
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
        Loading your trading data…
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="fade-in-up">

      {/* Pre-market popup */}
      {preMarketOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="clay-card-gold" style={{ padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>☀️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--gold)', marginBottom: '8px' }}>Pre-Market Routine</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>London session opens at 1:30 PM IST. Complete your routine:</p>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
              {['Check higher TF bias (H4/D1)', 'Mark POI zones for today', 'Check Forex Factory for news', 'Assess your emotional state', 'Set max trades (Gold: multiple, Pairs: 1–4/week)'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(240,185,11,0.15)', border: '1px solid rgba(240,185,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--gold)', flexShrink: 0 }}>{i+1}</span>
                  {item}
                </div>
              ))}
            </div>
            <button className="clay-btn clay-btn-gold" style={{ padding: '13px 32px', width: '100%' }} onClick={() => setPreMarketOpen(false)}>
              ✓ I&apos;m Ready to Trade
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
        <Link href="/checklist">
          <button className="clay-btn clay-btn-gold" style={{ padding: '14px 28px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronRight size={18} />
            START TRADE CHECKLIST
          </button>
        </Link>
      </div>

      {/* Session Banner */}
      <div style={{
        padding: '16px 24px',
        borderRadius: '18px',
        background: session.isActive
          ? session.name === 'London' ? 'linear-gradient(135deg, rgba(240,185,11,0.1), rgba(240,185,11,0.02))'
          : session.name === 'New York' ? 'linear-gradient(135deg, rgba(0,200,83,0.1), rgba(0,200,83,0.02))'
          : 'linear-gradient(135deg, rgba(100,149,237,0.1), rgba(100,149,237,0.02))'
          : 'var(--bg-card-2)',
        border: session.isActive ? '1px solid rgba(240,185,11,0.4)' : '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: 'var(--clay-shadow-sm)',
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: session.isActive ? (session.name === 'London' ? 'var(--gold)' : session.name === 'New York' ? 'var(--success)' : '#6495ED') : 'var(--text-secondary)',
          boxShadow: session.isActive ? '0 0 10px currentColor' : 'none',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: session.isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {session.isActive ? `${session.name} Session Active` : 'Market Off-Hours'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {session.isActive
              ? `${session.istStart}–${session.istEnd} IST · ${session.isPrimary ? 'Primary session — high priority' : 'Secondary session — lower priority'}`
              : 'London: 1:30–4:30 PM IST · New York: 6:30–9:00 PM IST · Asian: 5:30–8:30 AM IST'}
          </div>
        </div>
        {!session.isPrimary && session.name === 'Asian' && (
          <span className="clay-tag clay-tag-warning" style={{ marginLeft: 'auto' }}>⚠ Lower Priority</span>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Today's Trades" value={todayTrades.length} sub={`${todayTrades.filter(t => t.result === 'Win').length} wins`} icon={<Target size={18} />} color="var(--gold)" />
        <StatCard label="Win Rate (30d)" value={`${winRate30}%`} sub={`${wins30}/${last30.length} trades`} icon={<TrendingUp size={18} />} color={winRate30 >= 50 ? 'var(--success)' : 'var(--danger)'} />
        <StatCard label="PnL (month)" value={formatCurrency(monthPnL)} sub={`${monthTrades.length} trades`} icon={<DollarSign size={18} />} color={monthPnL >= 0 ? 'var(--success)' : 'var(--danger)'} trend={monthPnL < 0 ? 'down' : 'up'} />
        <StatCard label="Win Streak" value={`${streak}🔥`} sub="consecutive wins" icon={<Zap size={18} />} color="var(--warning)" />
        <StatCard label="Compliance" value={`${compliancePct}%`} sub="checklist completion" icon={<Shield size={18} />} color={compliancePct >= 80 ? 'var(--success)' : 'var(--warning)'} />
        <StatCard label="Avg R:R" value={avgRR > 0 ? `${avgRR}R` : '–'} sub="on winning trades" icon={<Award size={18} />} color="var(--gold)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
        {/* Recent Trades */}
        <div className="clay-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Recent Trades</h2>
            <Link href="/calendar" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none', fontWeight: '600' }}>
              View all →
            </Link>
          </div>
          <RecentTrades trades={trades} />
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Journal status */}
          <div className="clay-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today&apos;s Journal</h3>
            {journal ? (
              <div className="banner-success" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>Journal filled ✓</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bias: {journal.market_bias} · {journal.emotional_state}</div>
                </div>
              </div>
            ) : (
              <div className="banner-danger" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--danger)' }}>Journal not filled</div>
                  <Link href="/journal" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>Fill it now →</Link>
                </div>
              </div>
            )}
          </div>

          {/* News Warning */}
          <div className="banner-warning" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--warning)' }}>News Reminder</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Always check <strong style={{ color: 'var(--warning)' }}>Forex Factory</strong> before entering. Avoid trading 30 mins before/after red news events.
            </p>
            <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' }}>
              Open Forex Factory →
            </a>
          </div>
        </div>
      </div>

      {/* Weekly PnL Chart */}
      <div className="clay-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Weekly PnL</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barSize={36}>
            <XAxis dataKey="day" tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--clay-shadow)' }}
              formatter={(v: any) => [formatCurrency(v), 'PnL']}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="pnl" radius={[8, 8, 0, 0]}>
              {weekData.map((d, i) => (
                <Cell key={i} fill={d.pnl > 0 ? '#00C853' : d.pnl < 0 ? '#FF3D00' : '#718096'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

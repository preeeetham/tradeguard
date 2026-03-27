'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Trade, Journal } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

interface DayData {
  date: string
  trades: Trade[]
  journal: Journal | null
  pnl: number
  allRulesFollowed: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [selected, setSelected] = useState<DayData | null>(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const start = new Date(year, month, 1).toISOString().split('T')[0]
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const [{ data: t }, { data: j }] = await Promise.all([
      supabase.from('trades').select('*').eq('user_id', user.id).gte('date', start).lte('date', end),
      supabase.from('journal').select('*').eq('user_id', user.id).gte('date', start).lte('date', end),
    ])
    setTrades(t || [])
    setJournals(j || [])
    setLoading(false)
  }, [viewDate])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  function getDayData(dateStr: string): DayData {
    const dayTrades = trades.filter(t => t.date === dateStr)
    const journal = journals.find(j => j.date === dateStr) || null
    const pnl = dayTrades.reduce((s, t) => s + (t.pnl || 0), 0)
    const allRulesFollowed = dayTrades.length > 0 && dayTrades.every(t => t.checklist_completed)
    return { date: dateStr, trades: dayTrades, journal, pnl, allRulesFollowed }
  }

  function getDayColor(pnl: number, hasTrades: boolean): string {
    if (!hasTrades) return 'transparent'
    if (pnl > 0) return 'rgba(0,200,83,0.12)'
    if (pnl < 0) return 'rgba(255,61,0,0.12)'
    return 'rgba(255,179,0,0.12)'
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthTrades = trades.filter(t => t.result !== 'Pending')
  const monthWins = monthTrades.filter(t => t.result === 'Win').length
  const monthPnL = trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const monthWR = monthTrades.length > 0 ? Math.round((monthWins / monthTrades.length) * 100) : 0

  const today = new Date().toISOString().split('T')[0]

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading calendar…</div>

  return (
    <div className="fade-in-up" style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Trade Calendar</h1>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div className="clay-card" style={{ padding: '12px 20px', display: 'flex', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Month PnL</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: monthPnL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {monthPnL >= 0 ? '+' : ''}{formatCurrency(monthPnL)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Win Rate</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: monthWR >= 50 ? 'var(--success)' : 'var(--danger)' }}>{monthWR}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button className="clay-btn" onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ padding: '10px 20px', background: 'var(--bg-card-2)', color: 'var(--text-primary)' }}>←</button>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{MONTHS[month]} {year}</h2>
          <button className="clay-btn" onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ padding: '10px 20px', background: 'var(--bg-card-2)', color: 'var(--text-primary)' }}>→</button>
        </div>

        {/* Calendar grid */}
        <div className="clay-card" style={{ padding: '20px' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', padding: '8px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const data = getDayData(dateStr)
              const hasTrades = data.trades.length > 0
              const isToday = dateStr === today

              return (
                <div key={day} onClick={() => setSelected(data)} style={{
                  minHeight: '80px',
                  padding: '8px',
                  borderRadius: '12px',
                  background: getDayColor(data.pnl, hasTrades),
                  border: isToday ? '2px solid var(--gold)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }} className="clay-card">
                  <div style={{ fontSize: '13px', fontWeight: isToday ? '800' : '500', color: isToday ? 'var(--gold)' : 'var(--text-primary)', marginBottom: '4px' }}>{day}</div>
                  {hasTrades && (
                    <>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{data.trades.length} trade{data.trades.length > 1 ? 's' : ''}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: data.pnl > 0 ? 'var(--success)' : data.pnl < 0 ? 'var(--danger)' : 'var(--warning)' }}>
                        {data.pnl > 0 ? '+' : ''}{data.pnl.toFixed(0)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: '6px', right: '6px',
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: data.allRulesFollowed ? 'var(--success)' : 'var(--danger)',
                        boxShadow: `0 0 6px ${data.allRulesFollowed ? 'var(--success)' : 'var(--danger)'}`,
                      }} />
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[
              { color: 'rgba(0,200,83,0.2)', label: 'Profitable day' },
              { color: 'rgba(255,61,0,0.2)', label: 'Loss day' },
              { color: 'rgba(255,179,0,0.2)', label: 'Breakeven' },
              { bg: 'var(--success)', label: '● Rules followed' },
              { bg: 'var(--danger)', label: '● Rules broken' },
            ].map(({ color, label, bg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {color && <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: color, border: '1px solid rgba(255,255,255,0.1)' }} />}
                {bg && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: bg, boxShadow: `0 0 5px ${bg}` }} />}
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="clay-card" style={{ width: '360px', padding: '24px', flexShrink: 0, position: 'sticky', top: '20px', alignSelf: 'flex-start', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '16px' }}>{new Date(selected.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={18} />
            </button>
          </div>

          {selected.trades.length === 0 && !selected.journal ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No trades or journal for this day.</p>
          ) : (
            <>
              {/* Trades */}
              {selected.trades.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Trades</div>
                  {selected.trades.map(t => (
                    <div key={t.id} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-input)', marginBottom: '8px', boxShadow: 'var(--clay-shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: t.instrument === 'XAU/USD' ? 'var(--gold)' : 'var(--text-primary)', fontSize: '14px' }}>{t.instrument}</span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: t.pnl > 0 ? 'var(--success)' : t.pnl < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span className="clay-tag clay-tag-neutral" style={{ fontSize: '11px' }}>{t.direction}</span>
                        <span className="clay-tag clay-tag-neutral" style={{ fontSize: '11px' }}>{t.model}</span>
                        <span className="clay-tag" style={{ fontSize: '11px', background: t.result === 'Win' ? 'rgba(0,200,83,0.1)' : t.result === 'Loss' ? 'rgba(255,61,0,0.1)' : 'rgba(255,179,0,0.1)', color: t.result === 'Win' ? 'var(--success)' : t.result === 'Loss' ? 'var(--danger)' : 'var(--warning)', border: 'none' }}>{t.result}</span>
                        {t.rr_achieved !== null && <span className="clay-tag clay-tag-gold" style={{ fontSize: '11px' }}>{t.rr_achieved}R</span>}
                      </div>
                    </div>
                  ))}
                  <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Day total</span>
                    <span style={{ fontWeight: '800', fontSize: '16px', color: selected.pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {selected.pnl >= 0 ? '+' : ''}{formatCurrency(selected.pnl)}
                    </span>
                  </div>
                </div>
              )}

              {/* Journal */}
              {selected.journal && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Journal</div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-input)', boxShadow: 'var(--clay-shadow-sm)', fontSize: '13px', lineHeight: 1.6 }}>
                    <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-secondary)' }}>Bias:</span> <strong>{selected.journal.market_bias}</strong></div>
                    <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-secondary)' }}>Emotion:</span> <strong>{selected.journal.emotional_state}</strong></div>
                    <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-secondary)' }}>Rules followed:</span> <strong style={{ color: selected.journal.followed_rules ? 'var(--success)' : 'var(--danger)' }}>{selected.journal.followed_rules ? 'Yes' : 'No'}</strong></div>
                    {selected.journal.lessons && (
                      <div><span style={{ color: 'var(--text-secondary)' }}>Lesson:</span> {selected.journal.lessons}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ChecklistData, Profile } from '@/types'
import { calcPositionSize, calcTargets, getCurrentSessionIST } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, CheckCircle, XCircle, Star, Zap,
  ChevronRight, ChevronLeft, Shield
} from 'lucide-react'

const STEPS = ['Pre-Trade', 'Setup', 'Entry Signal', 'Risk Mgmt', 'Final Gate']

const initChecklist: ChecklistData = {
  session: '',
  no_red_news_before: false, no_red_news_after: false,
  higher_tf_trend: '', mid_tf_agrees: false, entry_tf_aligned: false, entry_timeframe: '',
  all_tfs_aligned: false, zone_marked: false, confluences: 0, zone_fresh: false,
  price_from_correct_side: false,
  model: '', star_candle_formed: false, star_wick_2x: false, star_closed_inside: false,
  star_close_confirmed: false, star_entry_within_30: false,
  engulf_candle_formed: false, engulf_opposite_visible: false, engulf_ob_marked: false, engulf_close_confirmed: false,
  instrument: 'XAU/USD', direction: '', entry_price: 0, stop_loss: 0, stop_pips: 0,
  risk_amount: 0, position_size: 0, target_1: 0, target_2: 0,
  price_not_closed_through_poi: false, wick_is_2x: false, entry_not_stale: false, stop_not_too_wide: false,
}

function CheckItem({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <input type="checkbox" className="clay-checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} style={{ marginTop: '1px' }} />
      <span style={{ fontSize: '14px', lineHeight: 1.5, userSelect: 'none' }}>{label}</span>
    </label>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          STEP {current + 1} OF {total} — {STEPS[current]}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '700' }}>
          {Math.round(((current + 1) / total) * 100)}%
        </span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '800',
              background: i < current ? 'var(--success)' : i === current ? 'var(--gold)' : 'var(--bg-card-2)',
              color: i < current ? '#001A00' : i === current ? '#0A0A00' : 'var(--text-secondary)',
              boxShadow: i === current ? '0 0 12px rgba(240,185,11,0.4)' : 'none',
              transition: 'all 0.3s',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '10px', color: i === current ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: i === current ? '700' : '400', letterSpacing: '0.03em', textAlign: 'center' }}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChecklistPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [cl, setCl] = useState<ChecklistData>({ ...initChecklist })
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const curSession = getCurrentSessionIST()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => setProfile(p))
    })
  }, [])

  function update<K extends keyof ChecklistData>(key: K, value: ChecklistData[K]) {
    setCl(prev => {
      const next = { ...prev, [key]: value }
      // Auto-calc when price/stop changes
      if ((key === 'entry_price' || key === 'stop_loss' || key === 'instrument' || key === 'direction') && next.entry_price && next.stop_loss && next.direction) {
        const acct = profile?.account_size || 10000
        const riskPct = profile?.risk_per_trade || 1
        const { positionSize, riskAmount, stopPips } = calcPositionSize(acct, riskPct, next.entry_price, next.stop_loss, next.instrument)
        const { t1, t2 } = calcTargets(next.entry_price, next.stop_loss, next.direction as 'Long' | 'Short')
        return { ...next, position_size: positionSize, risk_amount: riskAmount, stop_pips: stopPips, target_1: t1, target_2: t2 }
      }
      return next
    })
  }

  // Validation for each step
  const step1Valid = cl.session !== '' && cl.no_red_news_before && cl.no_red_news_after
  const step2Valid = cl.higher_tf_trend !== '' && cl.mid_tf_agrees && cl.entry_tf_aligned && cl.all_tfs_aligned && cl.zone_marked && cl.confluences >= 3 && cl.zone_fresh && cl.price_from_correct_side

  const step3Valid = cl.model !== '' && (
    cl.model === 'Star'
      ? cl.star_candle_formed && cl.star_wick_2x && cl.star_closed_inside && cl.star_close_confirmed && cl.star_entry_within_30
      : cl.engulf_candle_formed && cl.engulf_opposite_visible && cl.engulf_ob_marked && cl.engulf_close_confirmed
  )
  const step4Valid = cl.entry_price > 0 && cl.stop_loss > 0 && cl.direction !== '' && cl.stop_pips >= 10 && cl.stop_pips <= 80
  const allInvalidationChecked = cl.price_not_closed_through_poi && cl.wick_is_2x && cl.entry_not_stale && cl.stop_not_too_wide

  const canProceed = [step1Valid, step2Valid, step3Valid, step4Valid, allInvalidationChecked][step]

  async function handleLogTrade() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setSaving(false); return }

    const payload = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      session: cl.session,
      instrument: cl.instrument,
      direction: cl.direction,
      model: cl.model,
      timeframe: cl.entry_timeframe,
      confluences: cl.confluences,
      entry_price: cl.entry_price,
      stop_loss: cl.stop_loss,
      target_1: cl.target_1,
      target_2: cl.target_2,
      stop_pips: cl.stop_pips,
      risk_amount: cl.risk_amount,
      position_size: cl.position_size,
      result: 'Pending',
      pnl: 0,
      checklist_completed: true,
      checklist_data: cl,
      notes,
    }

    const { error } = await supabase.from('trades').insert(payload)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Trade logged! Stick to the plan. 💪')
      setCl({ ...initChecklist })
      setStep(0)
      router.push('/dashboard')
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="fade-in-up">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Trade Checklist</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Complete all steps before entering. No exceptions.
        </p>
      </div>

      {/* Forbidden alert: outside session */}
      {!curSession.isActive && step === 0 && (
        <div className="banner-danger" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '15px' }}>⛔ Market Off-Hours Warning</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              You are outside active sessions. London: 1:30–4:30 PM IST · NY: 6:30–9:00 PM IST. Proceed with extra caution.
            </div>
          </div>
        </div>
      )}

      <div className="clay-card" style={{ padding: '32px' }}>
        <StepIndicator current={step} total={STEPS.length} />

        {/* STEP 1 */}
        {step === 0 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} style={{ color: 'var(--gold)' }} /> Pre-Trade Checks
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trading Session (IST)</label>
              <div className="radio-toggle">
                {[
                  { id: 'Asian', label: '🌏 Asian', sub: '5:30–8:30 AM' },
                  { id: 'London', label: '🇬🇧 London', sub: '1:30–4:30 PM' },
                  { id: 'New York', label: '🗽 New York', sub: '6:30–9:00 PM' },
                ].map(s => (
                  <div key={s.id} className={`radio-toggle-option ${cl.session === s.id ? 'selected' : ''}`} onClick={() => update('session', s.id as ChecklistData['session'])} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '13px' }}>{s.label}</span>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{s.sub} IST</span>
                  </div>
                ))}
              </div>
              {cl.session === 'Asian' && (
                <div className="banner-warning" style={{ padding: '10px 14px', marginTop: '10px', fontSize: '13px', color: 'var(--warning)' }}>
                  ⚠ Asian session — lower priority. Proceed with caution and reduced size.
                </div>
              )}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>News Filter</label>
              <CheckItem label="No red news event in the next 30 minutes" checked={cl.no_red_news_before} onChange={v => update('no_red_news_before', v)} />
              <CheckItem label="Not within 30 mins after a red news event" checked={cl.no_red_news_after} onChange={v => update('no_red_news_after', v)} />
            </div>

            {(!cl.no_red_news_before || !cl.no_red_news_after) && (cl.no_red_news_before !== false || cl.no_red_news_after !== false || cl.session) && (
              <div className="banner-danger" style={{ padding: '12px 16px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={18} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)' }}>DO NOT TRADE — News Risk Active</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>📊 Setup Checks</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Higher TF Trend</label>
              <div className="radio-toggle">
                {['Bullish', 'Bearish', 'Ranging'].map(t => (
                  <div key={t} className={`radio-toggle-option ${cl.higher_tf_trend === t ? 'selected' : ''}`} onClick={() => update('higher_tf_trend', t as ChecklistData['higher_tf_trend'])}>
                    {t === 'Bullish' ? '↑' : t === 'Bearish' ? '↓' : '↔'} {t}
                  </div>
                ))}
              </div>
            </div>

            <CheckItem label="Higher timeframe trend identified" checked={cl.higher_tf_trend !== ''} onChange={() => {}} disabled />
            <CheckItem label="Mid TF agrees with higher TF" checked={cl.mid_tf_agrees} onChange={v => update('mid_tf_agrees', v)} />
            <CheckItem label="Entry TF aligned" checked={cl.entry_tf_aligned} onChange={v => update('entry_tf_aligned', v)} />

            {cl.entry_tf_aligned && (
              <div style={{ margin: '8px 0 12px', paddingLeft: '32px' }}>
                <select className="clay-select" value={cl.entry_timeframe} onChange={e => update('entry_timeframe', e.target.value)} style={{ maxWidth: '200px' }}>
                  <option value="">Select timeframe</option>
                  <option value="5m">Gold: 5min</option>
                  <option value="15m">Gold: 15min</option>
                  <option value="30m">Pairs: 30min</option>
                  <option value="1H">Pairs: 1Hr</option>
                </select>
              </div>
            )}

            <CheckItem label="All timeframes in same direction" checked={cl.all_tfs_aligned} onChange={v => update('all_tfs_aligned', v)} />

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>POI Zone</h3>
            <CheckItem label="Zone marked between HH-HL or LL-LH" checked={cl.zone_marked} onChange={v => update('zone_marked', v)} />

            <div style={{ paddingLeft: '0px', marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', marginTop: '10px' }}>
                Number of Confluences <span style={{ color: cl.confluences >= 3 ? 'var(--success)' : 'var(--danger)' }}>({cl.confluences})</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="number" className="clay-input" style={{ maxWidth: '120px' }} min={0} max={10} value={cl.confluences || ''} onChange={e => update('confluences', parseInt(e.target.value) || 0)} placeholder="0" />
                {cl.confluences > 0 && cl.confluences < 3 && (
                  <div className="banner-danger" style={{ padding: '8px 14px', fontSize: '13px', color: 'var(--danger)' }}>
                    ⛔ Minimum 3 required — cannot proceed
                  </div>
                )}
                {cl.confluences >= 3 && (
                  <div className="banner-success" style={{ padding: '8px 14px', fontSize: '13px', color: 'var(--success)' }}>
                    ✓ {cl.confluences} confluences
                  </div>
                )}
              </div>
            </div>

            <CheckItem label="Zone is fresh (not previously tested multiple times)" checked={cl.zone_fresh} onChange={v => update('zone_fresh', v)} />
            <CheckItem label="Price approaching from the correct side" checked={cl.price_from_correct_side} onChange={v => update('price_from_correct_side', v)} />
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>⭐ Entry Signal</h2>

            {/* Model selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Model</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'Star', icon: '⭐', label: 'Star Signal', sub: 'Primary Model', badge: 'PRIMARY' },
                  { id: 'Engulf', icon: '🕯️', label: 'Engulf Signal', sub: 'Secondary Model', badge: 'SECONDARY' },
                ].map(m => (
                  <div key={m.id}
                    onClick={() => update('model', m.id as ChecklistData['model'])}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      border: cl.model === m.id ? '1.5px solid rgba(240,185,11,0.5)' : '1.5px solid var(--border)',
                      background: cl.model === m.id ? 'rgba(240,185,11,0.1)' : 'var(--bg-input)',
                      cursor: 'pointer',
                      boxShadow: cl.model === m.id ? '0 0 20px rgba(240,185,11,0.1), var(--clay-shadow-sm)' : 'var(--clay-shadow-sm)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{m.icon}</div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.sub}</div>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: m.id === 'Star' ? 'rgba(240,185,11,0.15)' : 'rgba(138,138,154,0.15)', color: m.id === 'Star' ? 'var(--gold)' : 'var(--text-secondary)', border: m.id === 'Star' ? '1px solid rgba(240,185,11,0.3)' : '1px solid rgba(138,138,154,0.2)', letterSpacing: '0.05em' }}>
                      {m.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {cl.model === 'Engulf' && (
              <div className="banner-warning" style={{ padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--warning)' }}>
                ⚠ Engulf model has ~10% lower confidence. Verify extra carefully.
              </div>
            )}

            {cl.model === 'Star' && (
              <div>
                <CheckItem label="Star/Doji/Plus candle formed at POI" checked={cl.star_candle_formed} onChange={v => update('star_candle_formed', v)} />
                <CheckItem label="Wick is 2x or more the body size" checked={cl.star_wick_2x} onChange={v => update('star_wick_2x', v)} />
                <CheckItem label="Candle body closed back inside zone" checked={cl.star_closed_inside} onChange={v => update('star_closed_inside', v)} />
                <CheckItem label="Full candle close confirmed" checked={cl.star_close_confirmed} onChange={v => update('star_close_confirmed', v)} />
                <CheckItem label="Entry is within 30 mins of candle close" checked={cl.star_entry_within_30} onChange={v => update('star_entry_within_30', v)} />
              </div>
            )}
            {cl.model === 'Engulf' && (
              <div>
                <CheckItem label="Big engulfing candle formed at POI" checked={cl.engulf_candle_formed} onChange={v => update('engulf_candle_formed', v)} />
                <CheckItem label="Opposite colour candle visible behind it" checked={cl.engulf_opposite_visible} onChange={v => update('engulf_opposite_visible', v)} />
                <CheckItem label="OB candle identified and marked" checked={cl.engulf_ob_marked} onChange={v => update('engulf_ob_marked', v)} />
                <CheckItem label="Full candle close confirmed" checked={cl.engulf_close_confirmed} onChange={v => update('engulf_close_confirmed', v)} />
              </div>
            )}
            {!cl.model && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Select a model above to view its checks
              </div>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === 3 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>📐 Risk Management</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>INSTRUMENT</label>
                <select className="clay-select" value={cl.instrument} onChange={e => update('instrument', e.target.value as ChecklistData['instrument'])}>
                  {['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'Other'].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>DIRECTION</label>
                <div className="radio-toggle">
                  <div className={`radio-toggle-option ${cl.direction === 'Long' ? 'selected-long' : ''}`} onClick={() => update('direction', 'Long')}>↑ Long</div>
                  <div className={`radio-toggle-option ${cl.direction === 'Short' ? 'selected-short' : ''}`} onClick={() => update('direction', 'Short')}>↓ Short</div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ENTRY PRICE</label>
                <input className="clay-input" type="number" step="0.001" value={cl.entry_price || ''} onChange={e => update('entry_price', parseFloat(e.target.value) || 0)} placeholder="e.g. 2345.50" />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>STOP LOSS</label>
                <input className="clay-input" type="number" step="0.001" value={cl.stop_loss || ''} onChange={e => update('stop_loss', parseFloat(e.target.value) || 0)} placeholder="e.g. 2340.00" />
              </div>
            </div>

            {cl.stop_pips > 0 && (
              <>
                {cl.stop_pips > 80 && (
                  <div className="banner-danger" style={{ padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <XCircle size={16} style={{ color: 'var(--danger)' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)' }}>Stop too wide ({cl.stop_pips.toFixed(1)} pips) — Skip this trade</span>
                  </div>
                )}
                {cl.stop_pips < 10 && (
                  <div className="banner-danger" style={{ padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <XCircle size={16} style={{ color: 'var(--danger)' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)' }}>Stop too tight ({cl.stop_pips.toFixed(1)} pips) — Check again</span>
                  </div>
                )}
                {cl.stop_pips >= 10 && cl.stop_pips <= 80 && (
                  <div className="banner-success" style={{ padding: '10px 16px', marginBottom: '12px', fontSize: '13px', color: 'var(--success)' }}>
                    ✓ Stop distance: {cl.stop_pips.toFixed(1)} pips — acceptable
                  </div>
                )}
              </>
            )}

            {/* Calculated values */}
            {cl.entry_price > 0 && cl.stop_loss > 0 && cl.direction && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                {[
                  { label: 'Risk Amount', value: `$${cl.risk_amount.toFixed(2)}`, color: 'var(--danger)' },
                  { label: 'Position Size', value: `${cl.position_size} lots`, color: 'var(--gold)' },
                  { label: 'Account Risk', value: `${profile?.risk_per_trade || 1}%`, color: 'var(--warning)' },
                  { label: 'Target 1 (1:3)', value: cl.target_1.toFixed(3), color: 'var(--success)' },
                  { label: 'Target 2 (1:5)', value: cl.target_2.toFixed(3), color: 'var(--success)' },
                  { label: 'Account Size', value: `$${(profile?.account_size || 10000).toLocaleString()}`, color: 'var(--text-secondary)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-input)', borderRadius: '14px', padding: '14px', boxShadow: 'var(--clay-shadow-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 5 */}
        {step === 4 && (
          <div className="fade-in-up">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>🏁 Final Gate</h2>

            {/* Summary */}
            <div style={{ background: 'var(--bg-card-2)', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: 'var(--clay-shadow-sm)' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trade Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                {[
                  ['Session', cl.session],
                  ['Instrument', cl.instrument],
                  ['Direction', cl.direction],
                  ['Model', cl.model],
                  ['Confluences', cl.confluences],
                  ['Entry', cl.entry_price ? cl.entry_price.toFixed(3) : '–'],
                  ['Stop Loss', cl.stop_loss ? cl.stop_loss.toFixed(3) : '–'],
                  ['Stop Pips', `${cl.stop_pips.toFixed(1)} pips`],
                  ['T1 (1:3)', cl.target_1 ? cl.target_1.toFixed(3) : '–'],
                  ['T2 (1:5)', cl.target_2 ? cl.target_2.toFixed(3) : '–'],
                  ['Risk', `$${cl.risk_amount.toFixed(2)}`],
                  ['Lot Size', cl.position_size],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invalidation rules */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--warning)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> Confirm No Invalidation Rules Apply
              </div>
              <CheckItem label="Price has NOT closed a full body candle through the POI" checked={cl.price_not_closed_through_poi} onChange={v => update('price_not_closed_through_poi', v)} />
              <CheckItem label="Signal candle wick IS 2x the body size" checked={cl.wick_is_2x} onChange={v => update('wick_is_2x', v)} />
              <CheckItem label="Entry is NOT more than 30 mins stale" checked={cl.entry_not_stale} onChange={v => update('entry_not_stale', v)} />
              <CheckItem label="Stop loss is NOT more than 80 pips" checked={cl.stop_not_too_wide} onChange={v => update('stop_not_too_wide', v)} />
            </div>

            {/* Optional notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>TRADE NOTES (optional)</label>
              <textarea className="clay-input" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any additional observations…" style={{ resize: 'vertical' }} />
            </div>

            {/* Final CTA */}
            {allInvalidationChecked ? (
              <button className="clay-btn clay-btn-success" disabled={saving} onClick={handleLogTrade}
                style={{ width: '100%', padding: '18px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: saving ? 0.7 : 1 }}>
                <CheckCircle size={22} />
                {saving ? 'Logging trade…' : 'LOG THIS TRADE ✅'}
              </button>
            ) : (
              <div className="banner-danger" style={{ padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <XCircle size={24} /> DO NOT TAKE THIS TRADE ❌
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Confirm all invalidation rules before logging
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
          <button className="clay-btn" onClick={() => setStep(s => s - 1)} disabled={step === 0}
            style={{ padding: '12px 24px', background: 'var(--bg-card-2)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', opacity: step === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={18} /> Previous
          </button>

          {step < STEPS.length - 1 && (
            <button className="clay-btn clay-btn-gold" onClick={() => setStep(s => s + 1)}
              disabled={!canProceed}
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: !canProceed ? 0.4 : 1 }}>
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>

        {!canProceed && step < STEPS.length - 1 && (
          <p style={{ fontSize: '12px', color: 'var(--danger)', textAlign: 'center', marginTop: '12px' }}>
            Complete all required fields to proceed
          </p>
        )}
      </div>
    </div>
  )
}

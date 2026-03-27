'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Journal } from '@/types'
import { toast } from 'sonner'
import { AlertTriangle, BookOpen } from 'lucide-react'

const EMOTIONAL_STATES = ['Calm', 'Anxious', 'Confident', 'Fearful', 'Greedy', 'Neutral']
const BIASES = ['Bullish', 'Bearish', 'Ranging', 'Unclear']
const WARN_STATES = ['Anxious', 'Fearful', 'Greedy']

export default function JournalPage() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    date: today,
    market_bias: 'Bullish',
    pre_market_notes: '',
    post_market_notes: '',
    emotional_state: 'Calm',
    followed_rules: true,
    mistakes: '',
    lessons: '',
  })
  const [rulesBroken, setRulesBroken] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('journal').select('*').eq('user_id', user.id).order('date', { ascending: false })
    setJournals(data || [])
    // Check if today exists
    const todayEntry = data?.find(j => j.date === today)
    if (todayEntry) {
      setForm({
        date: todayEntry.date,
        market_bias: todayEntry.market_bias,
        pre_market_notes: todayEntry.pre_market_notes || '',
        post_market_notes: todayEntry.post_market_notes || '',
        emotional_state: todayEntry.emotional_state,
        followed_rules: todayEntry.followed_rules,
        mistakes: todayEntry.mistakes || '',
        lessons: todayEntry.lessons || '',
      })
      setEditingId(todayEntry.id)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      ...form,
      mistakes: !form.followed_rules ? rulesBroken + (form.mistakes ? '\n' + form.mistakes : '') : form.mistakes,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('journal').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('journal').insert(payload))
    }

    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Journal saved! Reflection is the foundation of growth.')
      await load()
    }
    setSaving(false)
  }

  if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading journal…</div>

  return (
    <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px', alignItems: 'flex-start' }}>
      {/* Form */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>
          <span style={{ color: 'var(--gold)' }}>📖</span> Daily Journal
        </h1>

        <div className="clay-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Date */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</label>
              <input type="date" className="clay-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ maxWidth: '200px' }} />
            </div>

            {/* Market bias */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Market Bias Today</label>
              <div className="radio-toggle">
                {BIASES.map(b => (
                  <div key={b} className={`radio-toggle-option ${form.market_bias === b ? 'selected' : ''}`} onClick={() => setForm(p => ({ ...p, market_bias: b }))}>
                    {b === 'Bullish' ? '↑' : b === 'Bearish' ? '↓' : b === 'Ranging' ? '↔' : '?'} {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Pre market */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pre-Market Plan</label>
              <textarea className="clay-input" rows={4} placeholder="What is your plan today? Key levels, bias, session focus…" value={form.pre_market_notes} onChange={e => setForm(p => ({ ...p, pre_market_notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>

            {/* Emotional state */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Emotional State</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EMOTIONAL_STATES.map(state => {
                  const isWarn = WARN_STATES.includes(state)
                  const isSelected = form.emotional_state === state
                  return (
                    <button key={state} type="button" onClick={() => setForm(p => ({ ...p, emotional_state: state }))} style={{
                      padding: '9px 18px',
                      borderRadius: '100px',
                      border: isSelected ? `1.5px solid ${isWarn ? 'var(--warning)' : 'var(--gold-dark)'}` : '1.5px solid rgba(0,0,0,0.08)',
                      background: isSelected ? (isWarn ? 'rgba(255,179,0,0.12)' : 'rgba(240,185,11,0.1)') : 'var(--bg-input)',
                      color: isSelected ? (isWarn ? 'var(--warning)' : 'var(--gold-dark)') : 'var(--text-secondary)',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      boxShadow: 'var(--clay-shadow-sm)',
                      transition: 'all 0.2s',
                    }}>
                      {state}
                    </button>
                  )
                })}
              </div>
              {WARN_STATES.includes(form.emotional_state) && (
                <div className="banner-warning" style={{ padding: '12px 16px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: 'var(--warning)', fontWeight: '600' }}>
                    {form.emotional_state} detected — trade with reduced size or sit out today.
                  </span>
                </div>
              )}
            </div>

            {/* Post market */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post-Market Notes</label>
              <textarea className="clay-input" rows={4} placeholder="What happened today? How did you feel during trades?" value={form.post_market_notes} onChange={e => setForm(p => ({ ...p, post_market_notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>

            {/* Rules followed */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Did You Follow All Rules Today?</label>
              <div className="radio-toggle">
                <div className={`radio-toggle-option ${form.followed_rules ? 'selected' : ''}`} onClick={() => setForm(p => ({ ...p, followed_rules: true }))}>
                  ✓ Yes
                </div>
                <div className={`radio-toggle-option ${!form.followed_rules ? 'selected' : ''}`} onClick={() => setForm(p => ({ ...p, followed_rules: false }))}
                  style={{ background: !form.followed_rules ? 'rgba(255,61,0,0.15)' : undefined, color: !form.followed_rules ? 'var(--danger)' : undefined }}>
                  ✗ No
                </div>
              </div>
              {!form.followed_rules && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--danger)', display: 'block', marginBottom: '8px' }}>What rule did you break?</label>
                  <textarea className="clay-input" rows={2} placeholder="Describe the rule violation…" value={rulesBroken} onChange={e => setRulesBroken(e.target.value)} style={{ resize: 'vertical', borderColor: 'rgba(255,61,0,0.3)' }} />
                </div>
              )}
            </div>

            {/* Mistakes / lessons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mistakes Made</label>
                <textarea className="clay-input" rows={3} placeholder="What went wrong?" value={form.mistakes} onChange={e => setForm(p => ({ ...p, mistakes: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lessons Learned</label>
                <textarea className="clay-input" rows={3} placeholder="What will you do differently?" value={form.lessons} onChange={e => setForm(p => ({ ...p, lessons: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </div>

            <button type="submit" className="clay-btn clay-btn-gold" disabled={saving} style={{ padding: '15px', fontSize: '15px', marginTop: '4px' }}>
              {saving ? 'Saving…' : editingId ? '✓ Update Journal' : '✓ Save Journal'}
            </button>
          </form>
        </div>
      </div>

      {/* Past entries */}
      <div style={{ position: 'sticky', top: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} style={{ color: 'var(--gold)' }} /> Past Entries
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '75vh', overflowY: 'auto' }}>
          {journals.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No past entries yet.</p>
          ) : journals.map(j => (
            <div key={j.id} className="clay-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px' }}>
                  {new Date(j.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="clay-tag" style={{
                    fontSize: '11px',
                    background: j.market_bias === 'Bullish' ? 'rgba(0,200,83,0.1)' : j.market_bias === 'Bearish' ? 'rgba(255,61,0,0.1)' : 'rgba(255,179,0,0.1)',
                    color: j.market_bias === 'Bullish' ? 'var(--success)' : j.market_bias === 'Bearish' ? 'var(--danger)' : 'var(--warning)',
                    border: 'none',
                  }}>{j.market_bias}</span>
                  <span className="clay-tag clay-tag-neutral" style={{ fontSize: '11px' }}>{j.emotional_state}</span>
                </div>
              </div>
              <span className={`clay-tag ${j.followed_rules ? 'clay-tag-success' : 'clay-tag-danger'}`} style={{ fontSize: '11px', marginBottom: '8px' }}>
                {j.followed_rules ? '✓ Rules followed' : '✗ Rules broken'}
              </span>
              {j.lessons && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>💡 {j.lessons}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

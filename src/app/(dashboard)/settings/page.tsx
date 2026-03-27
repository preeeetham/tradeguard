/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { toast } from 'sonner'
import { User, DollarSign, Percent, Bell, Globe } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', account_size: 10000, risk_per_trade: 1 })
  const [notifications, setNotifications] = useState({ journal_reminder: true, session_alerts: true, news_warning: true })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({ ...data, email: user.email || data.email })
        setForm({ 
          name: data.name || user.user_metadata?.full_name || user.user_metadata?.name || '', 
          account_size: data.account_size || 10000, 
          risk_per_trade: data.risk_per_trade || 1 
        })
      } else {
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name || ''
        setProfile({ id: user.id, email: user.email || '', name: metadataName, account_size: 10000, risk_per_trade: 1, created_at: new Date().toISOString() })
        setForm({ name: metadataName, account_size: 10000, risk_per_trade: 1 })
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    if (error) toast.error('Failed to save: ' + error.message)
    else toast.success('Settings saved!')
    setSaving(false)
  }

  const riskDollar = form.account_size * (form.risk_per_trade / 100)

  return (
    <div className="fade-in-up" style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '28px' }}>⚙️ Settings</h1>

      {/* Profile */}
      <div className="clay-card" style={{ padding: '32px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
          <User size={18} /> Profile
        </h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
            <input className="clay-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
            <input className="clay-input" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} /> Risk Management
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Size (USD)</label>
              <input className="clay-input" type="number" min={100} value={form.account_size} onChange={e => setForm(p => ({ ...p, account_size: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Per Trade (%)</label>
              <input className="clay-input" type="number" min={0.1} max={5} step={0.1} value={form.risk_per_trade} onChange={e => setForm(p => ({ ...p, risk_per_trade: parseFloat(e.target.value) || 1 }))} />
            </div>
          </div>

          {/* Risk preview */}
          <div style={{ background: 'var(--bg-card-2)', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--clay-shadow-sm)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Risk per trade in dollars:</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: riskDollar <= 200 ? 'var(--success)' : riskDollar <= 500 ? 'var(--warning)' : 'var(--danger)' }}>
              ${riskDollar.toFixed(2)}
            </span>
          </div>

          <button type="submit" className="clay-btn clay-btn-gold" disabled={saving} style={{ padding: '14px', fontSize: '15px' }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Timezone */}
      <div className="clay-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
          <Globe size={18} /> Timezone
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-card-2)', borderRadius: '14px', boxShadow: 'var(--clay-shadow-sm)' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>Indian Standard Time (IST)</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>UTC +5:30 · All sessions displayed in IST</div>
          </div>
          <span className="clay-tag clay-tag-gold" style={{ fontSize: '12px' }}>Active</span>
        </div>
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <div>🌏 <strong style={{ color: 'var(--text-primary)' }}>Asian Session:</strong> 5:30 AM – 8:30 AM IST</div>
          <div>🇬🇧 <strong style={{ color: 'var(--text-primary)' }}>London Session:</strong> 1:30 PM – 4:30 PM IST</div>
          <div>🗽 <strong style={{ color: 'var(--text-primary)' }}>New York Session:</strong> 6:30 PM – 9:00 PM IST</div>
        </div>
      </div>

      {/* Notifications */}
      <div className="clay-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
          <Bell size={18} /> Notification Preferences
        </h2>
        {[
          { key: 'journal_reminder', label: 'Remind me to fill journal at end of day (5:00 PM IST)', sub: 'Post-session journaling reminder' },
          { key: 'session_alerts', label: 'Show session alerts in navbar', sub: 'Live session indicator in IST' },
          { key: 'news_warning', label: 'Warn if I try to log a trade during news window', sub: 'Blocks dangerous news trades' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>{sub}</div>
            </div>
            <div
              onClick={() => setNotifications(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
              style={{
                width: '48px', height: '26px', borderRadius: '100px',
                background: notifications[key as keyof typeof notifications] ? 'linear-gradient(90deg, #F0B90B, #FFD84D)' : 'var(--bg-input)',
                boxShadow: notifications[key as keyof typeof notifications] ? '0 0 12px rgba(240,185,11,0.3), var(--clay-shadow-sm)' : 'var(--clay-shadow-sm)',
                cursor: 'pointer', position: 'relative', transition: 'all 0.25s', flexShrink: 0,
                border: '1px solid var(--border)',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'var(--bg-card)',
                position: 'absolute',
                top: '2px',
                left: notifications[key as keyof typeof notifications] ? '25px' : '3px',
                transition: 'left 0.25s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

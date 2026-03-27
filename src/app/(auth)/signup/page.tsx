'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { TrendingUp, Lock, Mail, User, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({ email, password })
    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        name,
        account_size: 10000,
        risk_per_trade: 1,
      })
      toast.success('Account created! Let the discipline begin.')
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(240,185,11,0.08) 0%, transparent 70%), var(--bg)',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeInUp 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #F0B90B, #FFD84D)',
            borderRadius: '22px',
            marginBottom: '20px',
            boxShadow: '0 0 30px rgba(240,185,11,0.3), var(--clay-shadow)',
          }}>
            <TrendingUp size={36} color="#0A0A00" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Trade<span style={{ color: 'var(--gold)' }}>Guard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px', fontStyle: 'italic' }}>
            &ldquo;Discipline is the edge&rdquo;
          </p>
        </div>

        <div className="clay-card" style={{ padding: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
            Start your journey to disciplined trading.
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>NAME</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="clay-input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>EMAIL</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="clay-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  className="clay-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required minLength={8}
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="banner-danger" style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--danger)' }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" className="clay-btn clay-btn-gold" disabled={loading}
              style={{ padding: '15px', fontSize: '15px', marginTop: '4px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'
import { Shield, Map as MapIcon, AlertTriangle, HeartPulse, Bot, Route, Globe, LifeBuoy, PenTool } from 'lucide-react'

// Floating petal component
function Petals() {
  const petals = ['🌸', '🌸', '🌺', '🌸', '🌸', '🌸', '🌺', '🌸']
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {petals.map((p, i) => (
        <div
          key={i}
          className="petal"
          style={{
            left: `${10 + i * 12}%`,
            animationDuration: `${8 + i * 1.5}s`,
            animationDelay: `${i * 1.2}s`,
            fontSize: `${12 + (i % 3) * 4}px`,
            opacity: 0
          }}
        >
          {p}
        </div>
      ))}
    </div>
  )
}

const STATS = [
  { icon: <Shield size={18} />, label: 'Incidents Mapped',  value: '1,247', trend: '+12% this week', color: 'var(--primary)'  },
  { icon: <MapIcon size={18} />, label: 'Safe Routes',       value: '856',   trend: '+8% this week',  color: 'var(--accent)'  },
  { icon: <AlertTriangle size={18} />, label: 'High Risk Zones',   value: '12',    trend: '-2% this week',  color: 'var(--warning)' },
  { icon: <HeartPulse size={18} />, label: 'Community Trust',   value: '98.2%', trend: '+4% this week',  color: 'var(--safe)'    },
]

const FEATURES = [
  {
    icon: <Bot size={24} />,
    title: 'AI Risk Prediction',
    desc: 'Gemini AI analyzes incidents in real-time, scoring location risk before you arrive.',
    color: 'var(--primary-subtle)',
  },
  {
    icon: <Route size={24} />,
    title: 'Safe Route Planning',
    desc: 'Routes calculated to avoid danger zones. Enter any address, get the safest path.',
    color: 'var(--accent-subtle)',
  },
  {
    icon: <Globe size={24} />,
    title: 'Community Reports',
    desc: 'Every report helps another woman stay safe. Crowdsourced intelligence, verified by AI.',
    color: 'var(--peach-subtle)',
  },
  {
    icon: <LifeBuoy size={24} />,
    title: 'One-Tap SOS',
    desc: 'Emergency alert sent to your trusted contacts with your live location in one tap.',
    color: 'var(--safe-subtle)',
  },
]

export default function HomePage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <Petals />

      {/* ── Hero Section ── */}
      <section className="min-h-[92vh] flex items-center p-6 md:p-10 lg:p-[40px_40px_40px_48px] relative overflow-hidden mt-16 md:mt-0">
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -50, left: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-[60px] w-full max-w-[1100px] relative z-10 w-full mt-10 md:mt-0">
          {/* Left: Text */}
          <div className="flex-1 min-w-0 w-full">
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--primary-subtle)', borderRadius: 'var(--r-pill)',
              padding: '6px 16px', marginBottom: 28,
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--primary)', fontSize: 14 }}>🌸</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.5px' }}>AI-Powered Women&apos;s Safety</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--heading-font)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--text)',
              marginBottom: 20,
            }}>
              Predict.<br />
              <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Prevent.</span><br />
              Protect.
            </h1>

            <p className="font-semibold" style={{
              fontSize: 17, color: 'var(--text-2)', lineHeight: 1.7,
              maxWidth: 480, marginBottom: 36
            }}>
              &quot;Our system doesn&apos;t wait for an attack to happen. It predicts risk, guides users away from danger, and continuously learns from community intelligence.&quot;
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link href="/map">
                <button className="btn-primary flex items-center justify-center gap-2" style={{ fontSize: 15, padding: '14px 32px' }}>
                  <MapIcon size={16} /> Explore Safety Map
                  <span style={{ marginLeft: 4 }}>→</span>
                </button>
              </Link>
              <Link href="/report">
                <button className="btn-ghost flex items-center justify-center gap-2" style={{ fontSize: 15, padding: '13px 28px' }}>
                  <PenTool size={16} /> Report Incident
                </button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {['Gemini AI', 'Real-time', 'Community'].map((tag) => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--safe)' }} />
                  {tag}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero image */}
          <div style={{
            flex: '0 0 auto', width: 'clamp(280px, 45%, 520px)',
            borderRadius: 'var(--r-xl)', overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            position: 'relative',
          }}>
            <img
              src="/avatar.jpg"
              alt="Cozy cherry blossom safety companion"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Floating AI card on image */}
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)', borderRadius: 'var(--r-md)',
              padding: '12px 16px', border: '1px solid rgba(212,113,122,0.15)',
              display: 'flex', alignItems: 'center', gap: 12
            }} className="dark:[background:rgba(13,10,24,0.85)]">
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--r-sm)',
                background: 'linear-gradient(135deg, var(--primary-subtle), var(--accent-subtle))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0
              }}><Bot size={20} /></div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>Gemini AI says</div>
                <div style={{ fontSize: 12, color: '#2D1F1F', lineHeight: 1.4 }}>This route is safe. Enjoy your walk! 🌸</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="px-6 md:px-10 pb-14">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)',
                    background: 'var(--primary-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>{s.icon}</div>
                  <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>
                    {s.trend.startsWith('+') ? '↑' : '↓'} {s.trend}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--heading-font)', fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="px-6 md:px-10 pb-20">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: 36, color: 'var(--text)', marginBottom: 12 }}>
              Your trusted <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>companion</span>
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              Every feature designed to make you feel protected, not afraid.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="card card-lift fade-up" style={{ padding: 28, animationDelay: `${i * 0.1}s` }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--r-md)',
                  background: f.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, marginBottom: 16
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--heading-font)', fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 md:px-10 pb-20">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6" style={{
            borderRadius: 'var(--r-xl)', padding: '48px 32px',
            background: 'linear-gradient(135deg, var(--primary-subtle) 0%, var(--accent-subtle) 100%)',
            border: '1px solid var(--border)'
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--heading-font)', fontSize: 32, color: 'var(--text)', marginBottom: 12 }}>
                Ready to explore safely? 🌸
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: 16, maxWidth: 400, lineHeight: 1.6 }}>
                Join thousands of women who travel with confidence using AuroraSafe.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/map">
                <button className="btn-primary" style={{ padding: '14px 32px', fontSize: 15 }}>
                  Get Started →
                </button>
              </Link>
              <Link href="/sos">
                <button className="btn-ghost flex items-center gap-1.5" style={{ padding: '13px 24px', fontSize: 15 }}>
                  <LifeBuoy size={16} /> SOS Setup
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

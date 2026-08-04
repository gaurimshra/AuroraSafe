'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

const NAV = [
  { href: '/',          icon: '🏠', label: 'Home' },
  { href: '/map',       icon: '🗺️', label: 'Safety Map' },
  { href: '/report',    icon: '✏️', label: 'Report' },
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/sos',       icon: '🆘', label: 'SOS' },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="sidebar" style={{ padding: '0' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--peach))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 12px rgba(212,113,122,0.3)'
          }}>🌸</div>
          <div>
            <div style={{ fontFamily: 'var(--heading-font)', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
              Aurora<span style={{ color: 'var(--primary)' }}>Safe</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500 }}>Safety Companion</div>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px', marginBottom: '4px' }}>Navigation</div>
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`sidebar-link${active ? ' active' : ''}`}
              >
                <span className="icon">{icon}</span>
                <span>{label}</span>
                {href === '/sos' && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--danger-subtle)',
                    color: 'var(--danger)', fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 'var(--r-pill)'
                  }}>HELP</span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Theme toggle + bottom card */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          style={{
            width: '100%', marginBottom: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? '🌙' : '☀️'} <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <div style={{
            width: 36, height: 20, borderRadius: 10,
            background: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
            position: 'relative', transition: 'background 0.25s'
          }}>
            <div style={{
              position: 'absolute', top: 3, left: theme === 'dark' ? 18 : 3,
              width: 14, height: 14, borderRadius: 7, background: 'white',
              transition: 'left 0.25s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </button>

        {/* Safety card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-subtle), var(--accent-subtle))',
          borderRadius: 'var(--r-md)', padding: '14px', border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>🌸</div>
          <div style={{ fontFamily: 'var(--heading-font)', fontSize: '13px', color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>Stay safe,<br />stay connected.</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5 }}>You&apos;re not alone. We&apos;ve got your back. 💕</div>
        </div>
      </div>
    </aside>
  )
}

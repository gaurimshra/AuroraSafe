'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { Home, Map as MapIcon, PenTool, LayoutDashboard, LifeBuoy, Users, Lock, Shield, Moon, Sun, HeartPulse } from 'lucide-react'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'

const NAV = [
  { href: '/',          icon: <Home size={18} />, label: 'Home' },
  { href: '/map',       icon: <MapIcon size={18} />, label: 'Safety Map' },
  { href: '/community', icon: <Users size={18} />, label: 'Community Feed' },
  { href: '/report',    icon: <PenTool size={18} />, label: 'Report' },
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { href: '/ngos',      icon: <Shield size={18} />, label: 'NGO Partners' },
  { href: '/sos',       icon: <LifeBuoy size={18} />, label: 'SOS' },
]

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const { user, isSignedIn, isLoaded } = useUser()

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ padding: '0' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--peach))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(212,113,122,0.3)', color: 'white'
          }}><HeartPulse size={20} /></div>
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

        {/* Account Section */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px', marginBottom: '8px' }}>Account</div>
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button
                className="sidebar-link"
                style={{ width: '100%', border: 'none', background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: 600, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Lock size={16} />
                <span>Sign In / Register</span>
              </button>
            </SignInButton>
          ) : (
            <div style={{ padding: '0 8px' }}>
              <div className="hover:border-primary transition-colors cursor-pointer" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserButton 
                  appearance={{
                    elements: { avatarBox: "w-8 h-8" }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link label="Profile Dashboard" labelIcon={<Shield size={14} />} href="/profile" />
                  </UserButton.MenuItems>
                </UserButton>
                <Link href="/profile" onClick={onClose} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', textDecoration: 'none' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user?.firstName || 'My Profile'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>Open Dashboard →</span>
                </Link>
              </div>
            </div>
          )}
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
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
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
          <div style={{ marginBottom: '6px', color: 'var(--primary)' }}><HeartPulse size={24} /></div>
          <div style={{ fontFamily: 'var(--heading-font)', fontSize: '13px', color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>Stay safe,<br />stay connected.</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5 }}>You&apos;re not alone. We&apos;ve got your back.</div>
        </div>
      </div>
    </aside>
  )
}

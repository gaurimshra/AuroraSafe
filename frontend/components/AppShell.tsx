'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      {/* Sidebar */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 39, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile topbar */}
      <div 
        className="md:hidden flex fixed top-0 left-0 right-0 h-14 z-40 items-center px-4 gap-3"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text)' }}
        >☰</button>
        <span style={{ fontFamily: 'var(--heading-font)', fontWeight: 700, fontSize: '16px', color: 'var(--text)' }}>
          Aurora<span style={{ color: 'var(--primary)' }}>Safe</span>
        </span>
      </div>

      {/* Main content */}
      <main className="app-main">
        {children}
      </main>
    </>
  )
}

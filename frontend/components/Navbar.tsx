'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { user, isLoaded, isSignedIn } = useUser()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/map', label: 'Safety Map' },
    { href: '/report', label: 'Report' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/sos', label: 'SOS' },
    { href: '/community', label: 'Community' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 glass-card rounded-none border-t-0 border-l-0 border-r-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">
                Aurora<span className="gradient-text">Safe</span>
              </span>
            </Link>
            {/* Live pulse indicator */}
            <div className="ml-3 hidden sm:flex items-center gap-1.5 bg-safe/10 border border-safe/30 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              <span className="text-[10px] text-safe font-medium uppercase tracking-wider">Live</span>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-primary/20 text-white'
                      : 'text-text-secondary hover:text-white hover:bg-card'
                  }`}
                >
                  {link.href === '/community' ? (
                    <span className="flex items-center gap-1">
                      {link.label}
                      <span className="text-[9px] bg-primary/30 text-primary px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                    </span>
                  ) : link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/sos"
              className="sos-pulse bg-danger text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-danger-light transition-colors"
            >
              🆘 SOS
            </Link>
            
            {/* Clerk Auth */}
            {/* Clerk Auth */}
            {!isSignedIn && (
              <SignInButton mode="modal">
                <button className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                  Sign In
                </button>
              </SignInButton>
            )}
            {isSignedIn && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary hidden lg:block">
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
                </span>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Profile Dashboard"
                      labelIcon={<span className="text-sm">🛡️</span>}
                      href="/profile"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            )}

            <Link
              href="/report"
              className="bg-surface border border-primary/50 text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/10 transition-all"
            >
              Report
            </Link>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-white hover:bg-card focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-surface border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? 'bg-primary/20 text-white'
                    : 'text-text-secondary hover:text-white hover:bg-card'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 pb-2 space-y-2">
              <Link
                href="/sos"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center sos-pulse bg-danger text-white px-4 py-2 rounded-full font-bold text-sm"
              >
                🆘 SOS
              </Link>
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button className="block w-full text-center bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg font-medium text-sm">
                    Sign In to Report
                  </button>
                </SignInButton>
              )}
              {isSignedIn && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="text-sm text-text-secondary">{user?.firstName}</span>
                  <UserButton />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

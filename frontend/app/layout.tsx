import type { Metadata } from 'next'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/lib/ThemeContext'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'AuroraSafe — AI-Powered Women\'s Safety Platform',
  description: 'Predict. Prevent. Protect. AI-powered safety companion helping women travel with confidence.',
  keywords: 'women safety, AI safety, safe routes, incident reporting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <ThemeProvider>
            <AppShell>
              {children}
            </AppShell>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

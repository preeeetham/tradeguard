import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TradeGuard — Discipline is the edge',
  description: 'Professional trading discipline app for Gold and Forex traders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        {children}
        <Toaster
          theme="light"
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              color: 'var(--text-primary)',
              boxShadow: 'var(--clay-shadow)',
            },
          }}
        />
      </body>
    </html>
  )
}

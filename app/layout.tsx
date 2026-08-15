import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { StockTicker } from '@/components/StockTicker'

export const metadata: Metadata = {
  title: 'Investment Simulator',
  description: 'Paper trading and investment simulation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0e14] text-slate-100 flex min-h-screen antialiased">
        {/* The Sidebar component */}
        <Sidebar />
        
        {/* The main content area for your pages */}
        <main className="flex-1 overflow-y-auto bg-[#05070a]">
          <StockTicker />
          {children}
        </main>

        {/* Global Toast Popup Container */}
        <Toaster position="top-center" richColors />

        {/* Vercel Web Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
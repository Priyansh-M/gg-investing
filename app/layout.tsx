import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'GG Investing',
  description: 'Virtual Stock Market',
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
          {children}
        </main>

        {/* Global Toast Popup Container */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
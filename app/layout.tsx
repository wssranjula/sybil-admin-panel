import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConditionalLayout } from '@/components/ConditionalLayout'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sybil Admin Panel - Climate Hub',
  description: 'AI-powered knowledge management for climate action',
  icons: {
    icon: '/icon.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  )
}

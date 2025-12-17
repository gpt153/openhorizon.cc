import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TRPCProvider } from '@/lib/trpc/Provider'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Open Horizon Project Companion',
    template: '%s | Open Horizon',
  },
  description: 'AI-powered platform for creating and managing Erasmus+ Youth Exchange projects. Generate comprehensive project concepts, activity plans, and application materials.',
  keywords: ['Erasmus+', 'Youth Exchange', 'Project Management', 'AI Assistant', 'Education', 'Youth Work'],
  authors: [{ name: 'Open Horizon' }],
  openGraph: {
    title: 'Open Horizon Project Companion',
    description: 'AI-powered platform for Erasmus+ Youth Exchange projects',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Horizon Project Companion',
    description: 'AI-powered platform for Erasmus+ Youth Exchange projects',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </TRPCProvider>
      </body>
    </html>
  )
}

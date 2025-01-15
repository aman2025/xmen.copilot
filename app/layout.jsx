import './globals.css'
import { Inter } from 'next/font/google'
import Sidebar from '@/components/Sidebar'
import Copilot from '@/components/copilot/Copilot'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Productivity Assistant',
  description: 'AI-powered productivity assistant',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="mx-auto max-w-7xl flex-1 p-4 md:p-8">{children}</main>
          <Copilot />
        </div>
      </body>
    </html>
  )
}

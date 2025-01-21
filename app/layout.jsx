import './globals.css'
import Providers from './providers'
import Sidebar from '@/components/Sidebar'
import Copilot from '@/components/copilot/Copilot'

export const metadata = {
  title: 'AI Productivity Assistant',
  description: 'AI-powered productivity assistant',
}

export default function RootLayout({ children }) {
  // Create a client instance inside the component

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main className="mx-auto max-w-7xl flex-1 p-4 md:p-8">{children}</main>
            <Copilot />
          </div>
        </Providers>
      </body>
    </html>
  )
}

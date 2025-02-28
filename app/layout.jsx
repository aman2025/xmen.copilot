import './globals.css'
import Providers from './providers'
import Sidebar from '@/components/Sidebar'
import Copilot from '@/components/copilot/Copilot'

export const metadata = {
  title: 'AI Productivity Assistant',
  description: 'AI-powered productivity assistant'
}

export default function RootLayout({ children }) {
  // Create a client instance inside the component

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="flex h-screen bg-[url('/bg.png')] px-[70px] py-[40px]">
            <div
              className="flex w-full overflow-hidden rounded-xl border border-[#5255ac] bg-[#f5f6f7]"
              style={{ boxShadow: '0 0 18px rgba(82, 85, 172, 0.32)' }}
            >
              <Sidebar />
              <main className="mx-auto max-w-7xl flex-1  p-4 md:p-8">{children}</main>
              <Copilot />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}

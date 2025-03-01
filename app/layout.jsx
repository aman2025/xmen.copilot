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
          <div className="flex h-screen bg-[url('/bg.png')] px-[66px] py-[45px]">
            <div
              className="flex w-full overflow-hidden rounded-xl border border-[#5255ac] bg-[#f5f6f7]"
              style={{ boxShadow: '0 0 88px rgba(82, 85, 172, 0.52)' }}
            >
              <Sidebar />
              <main className="mx-auto flex max-w-7xl flex-1 flex-col overflow-hidden p-4 md:p-4">
                {children}
              </main>
              <Copilot />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}

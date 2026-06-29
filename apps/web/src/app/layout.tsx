import type { Metadata } from 'next'
import ThemeRegistry from '@/components/ThemeRegistry'
import { SessionProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'AgentForge',
  description: 'Agentic Project Starter',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <SessionProvider>{children}</SessionProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}

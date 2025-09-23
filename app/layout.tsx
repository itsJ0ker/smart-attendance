// app/layout.tsx
import './globals.css'
import { AuthProvider } from '../hooks/useAuth'

export const metadata = {
  title: 'Smart QR Attendance System',
  description: 'A secure QR-based attendance management system for educational institutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased">
        <AuthProvider>
          <div id="root">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
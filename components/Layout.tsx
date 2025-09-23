// components/Layout.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const getNavItems = () => {
    if (!user) return []
    
    switch (user.role) {
      case 'admin':
        return [
          { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/admin/users', label: 'User Management', icon: '👥' },
          { href: '/admin/timetable', label: 'Timetable', icon: '📅' },
          { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
          { href: '/admin/anomalies', label: 'Anomaly Logs', icon: '⚠️' }
        ]
      case 'teacher':
        return [
          { href: '/teacher/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/teacher/lectures', label: 'My Lectures', icon: '🎓' },
          { href: '/teacher/attendance', label: 'Attendance', icon: '✅' },
          { href: '/teacher/analytics', label: 'Analytics', icon: '📈' }
        ]
      case 'student':
        return [
          { href: '/student/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/student/attendance', label: 'My Attendance', icon: '✅' },
          { href: '/student/scanner', label: 'QR Scanner', icon: '📱' }
        ]
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                🎓 Smart Attendance
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="text-sm text-indigo-600">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </div>
    </div>
  )
}
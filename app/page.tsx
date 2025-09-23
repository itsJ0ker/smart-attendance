// app/page.tsx
'use client'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role with proper hierarchy
        switch (user.role) {
          case 'super_admin':
          case 'admin':
            router.push('/admin/dashboard')
            break
          case 'teacher':
            router.push('/teacher/dashboard')
            break
          case 'student':
            router.push('/student/dashboard')
            break
          default:
            router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Initializing QR Attendance System..." />
  }

  return <LoadingSpinner fullScreen size="lg" text="Redirecting to your dashboard..." />
}
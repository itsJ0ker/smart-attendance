// components/layout/DashboardLayout.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import LoadingSpinner from '../ui/LoadingSpinner'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  requireAuth?: boolean
  allowedRoles?: string[]
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  requireAuth = true,
  allowedRoles = ['admin', 'teacher', 'student'],
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!loading && requireAuth) {
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [user, loading, requireAuth, allowedRoles, router])

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="lg" 
        text="Loading dashboard..." 
      />
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.div
        className={`${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'} ${
          isMobile && sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        animate={{
          x: isMobile && sidebarCollapsed ? '-100%' : '0%',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Sidebar
          collapsed={!isMobile && sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </motion.div>

      {/* Mobile Overlay */}
      {isMobile && !sidebarCollapsed && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={title}
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            className="container-fluid py-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
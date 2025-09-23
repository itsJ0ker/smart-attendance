// components/layout/Sidebar.tsx
'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  QrCode, 
  BarChart3, 
  Settings, 
  Shield, 
  Bell,
  Calendar,
  FileText,
  UserCheck,
  Building,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
  badge?: string
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: <UserCheck className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student'],
    children: [
      {
        label: 'Mark Attendance',
        href: '/student/dashboard',
        icon: <QrCode className="w-4 h-4" />,
        roles: ['student'],
      },
      {
        label: 'Generate QR',
        href: '/teacher/dashboard',
        icon: <QrCode className="w-4 h-4" />,
        roles: ['teacher'],
      },
      {
        label: 'View Records',
        href: '/attendance/records',
        icon: <FileText className="w-4 h-4" />,
        roles: ['admin', 'teacher'],
      },
    ],
  },
  {
    label: 'Students',
    href: '/students',
    icon: <GraduationCap className="w-5 h-5" />,
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Teachers',
    href: '/teachers',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: 'Subjects',
    href: '/subjects',
    icon: <BookOpen className="w-5 h-5" />,
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Departments',
    href: '/departments',
    icon: <Building className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: 'Schedule',
    href: '/schedule',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Analytics',
    href: '/admin/dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['admin'],
  },
  {
    label: 'Security',
    href: '/security',
    icon: <Shield className="w-5 h-5" />,
    roles: ['admin'],
    badge: '2',
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: <Bell className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin', 'teacher', 'student'],
  },
]

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const filteredNavItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.href)
    const active = isActive(item.href)
    const filteredChildren = item.children?.filter(child => 
      user?.role && child.roles.includes(user.role)
    )

    return (
      <div key={item.href}>
        <motion.div
          whileHover={{ x: collapsed ? 0 : 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <button
            onClick={() => {
              if (hasChildren && filteredChildren?.length) {
                toggleExpanded(item.href)
              } else {
                router.push(item.href)
              }
            }}
            className={`
              w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${active 
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }
              ${level > 0 ? 'ml-4' : ''}
            `}
          >
            <span className="flex-shrink-0">
              {item.icon}
            </span>
            
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="ml-3 flex-1 text-left"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {!collapsed && item.badge && (
              <span className="ml-auto bg-primary-100 text-primary-600 text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}

            {!collapsed && hasChildren && filteredChildren?.length && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-auto"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {!collapsed && hasChildren && isExpanded && filteredChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-1 space-y-1"
            >
              {filteredChildren.map(child => renderNavItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                QR Attend
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1.5"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map(item => renderNavItem(item))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={`w-full ${collapsed ? 'px-2' : 'justify-start'}`}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </motion.div>
  )
}

export default Sidebar
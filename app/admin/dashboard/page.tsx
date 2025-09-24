// app/admin/dashboard/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  UserX,
  Building,
  BookOpen,
  Settings,
  Download,
  Filter,
  Search,
  Bell,
  Eye,
  RefreshCw
} from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import UserManagement from '../../../components/admin/UserManagement'
import Analytics from '../../../components/admin/Analytics'
import { useAuth } from '../../../hooks/useAuth'
import { AttendanceRecord, User, AnomalyLog } from '../../../types'
import { adminService, AdminStats, SystemActivity } from '../../../services/adminService'

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'primary',
  trend = 'up'
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error'
  trend?: 'up' | 'down' | 'neutral'
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  }

  const trendColors = {
    up: 'text-success-600',
    down: 'text-error-600',
    neutral: 'text-gray-600'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            {change && (
              <p className={`text-sm ${trendColors[trend]} flex items-center mt-1`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const ActivityItem = ({ activity }: { activity: SystemActivity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'attendance':
        return <UserCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
      case 'user_created':
        return <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      case 'course_created':
        return <BookOpen className="w-5 h-5 text-warning-600 dark:text-warning-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getActivityColor = () => {
    switch (activity.type) {
      case 'attendance':
        return 'bg-success-100 dark:bg-success-900'
      case 'user_created':
        return 'bg-primary-100 dark:bg-primary-900'
      case 'course_created':
        return 'bg-warning-100 dark:bg-warning-900'
      default:
        return 'bg-gray-100 dark:bg-gray-900'
    }
  }

  const getBadgeVariant = () => {
    switch (activity.type) {
      case 'attendance':
        return 'success'
      case 'user_created':
        return 'primary'
      case 'course_created':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className={`w-10 h-10 ${getActivityColor()} rounded-full flex items-center justify-center`}>
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {activity.description}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {activity.details}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-900 dark:text-gray-100">{activity.time}</p>
        <Badge variant={getBadgeVariant() as any} size="sm">
          {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </div>
    </div>
  )
}



export default function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics'>('overview')
  const [timeRange, setTimeRange] = useState('today')
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<SystemActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch all dashboard data in parallel
      const [statsResponse, activityResponse] = await Promise.all([
        adminService.getStats(timeRange),
        adminService.getSystemActivity()
      ])

      if (statsResponse.success) {
        setAdminStats(statsResponse.data)
      }
      
      if (activityResponse.success) {
        setRecentActivity(activityResponse.data)
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const stats = adminStats ? [
    {
      title: 'Total Students',
      value: adminStats.totalStudents.toLocaleString(),
      change: adminStats.studentsTrend,
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'primary' as const,
      trend: 'up' as const
    },
    {
      title: 'Present Today',
      value: adminStats.presentToday.toLocaleString(),
      change: `${adminStats.attendanceRate}% rate`,
      icon: <UserCheck className="w-6 h-6" />,
      color: 'success' as const,
      trend: adminStats.attendanceTrend === 'up' ? 'up' as const : 
             adminStats.attendanceTrend === 'down' ? 'down' as const : 'neutral' as const
    },
    {
      title: 'Absent Today',
      value: adminStats.absentToday.toLocaleString(),
      change: adminStats.attendanceTrend === 'up' ? 'Improving' : 
              adminStats.attendanceTrend === 'down' ? 'Declining' : 'Stable',
      icon: <UserX className="w-6 h-6" />,
      color: 'warning' as const,
      trend: adminStats.attendanceTrend === 'up' ? 'down' as const : 
             adminStats.attendanceTrend === 'down' ? 'up' as const : 'neutral' as const
    },
    {
      title: 'Active Teachers',
      value: adminStats.activeTeachers.toString(),
      change: adminStats.teachersTrend,
      icon: <Users className="w-6 h-6" />,
      color: 'primary' as const,
      trend: 'up' as const
    }
  ] : []

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name}. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {activeTab === 'overview' && (
              <>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="form-select"
                  disabled={loading}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="semester">This Semester</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                >
                  Refresh
                </Button>
                <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
                  Export
                </Button>
              </>
            )}
            <Button variant="primary" size="sm" icon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <PieChart className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))
          )}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Chart */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Attendance Trends
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" icon={<BarChart3 className="w-4 h-4" />}>
                      Bar
                    </Button>
                    <Button variant="ghost" size="sm" icon={<Activity className="w-4 h-4" />}>
                      Line
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Chart visualization would be implemented here
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Integration with Chart.js or Recharts
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Quick Actions
                </h3>
              </CardHeader>
              <CardBody className="space-y-3">
                <Button variant="outline" fullWidth icon={<Users className="w-4 h-4" />}>
                  Manage Users
                </Button>
                <Button variant="outline" fullWidth icon={<BookOpen className="w-4 h-4" />}>
                  Course Management
                </Button>
                <Button variant="outline" fullWidth icon={<Calendar className="w-4 h-4" />}>
                  Schedule Classes
                </Button>
                <Button variant="outline" fullWidth icon={<BarChart3 className="w-4 h-4" />}>
                  Generate Reports
                </Button>
                <Button variant="outline" fullWidth icon={<Shield className="w-4 h-4" />}>
                  Security Settings
                </Button>
                <Button variant="outline" fullWidth icon={<Bell className="w-4 h-4" />}>
                  Notifications
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity and Anomalies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Recent Activity
                  </h3>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-1">
                {loading ? (
                  // Loading skeleton for activity
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    System Health
                  </h3>
                  <Badge variant="success" size="sm">
                    Healthy
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                    <Badge variant="success" size="sm">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">API Services</span>
                    <Badge variant="success" size="sm">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">QR Generation</span>
                    <Badge variant="success" size="sm">Active</Badge>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" size="sm" fullWidth>
                      View System Status
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
          </>
        )}

        {activeTab === 'users' && <UserManagement />}
        
        {activeTab === 'analytics' && <Analytics />}
      </div>
    </DashboardLayout>
  )
}
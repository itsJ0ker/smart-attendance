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
import { useAuth } from '../../../hooks/useAuth'
import { AttendanceRecord, User, AnomalyLog } from '../../../types'
import dashboardService, { DashboardActivity, DashboardAnomaly } from '../../../lib/services/dashboardService'

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

const ActivityItem = ({ activity }: { activity: DashboardActivity }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
    <div className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center">
      {activity.avatar_url ? (
        <img 
          src={activity.avatar_url} 
          alt={activity.student}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <UserCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {activity.student}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
        {activity.course}
      </p>
      {activity.lecture_title && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
          {activity.lecture_title}
        </p>
      )}
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-900 dark:text-gray-100">{activity.time}</p>
      <Badge variant="success" size="sm">Present</Badge>
    </div>
  </div>
)

const AnomalyItem = ({ anomaly, onResolve }: { anomaly: DashboardAnomaly, onResolve?: (id: string) => void }) => {
  const severityColors = {
    low: 'warning',
    medium: 'warning',
    high: 'error',
    critical: 'error'
  } as const

  const severityIcons = {
    low: <Eye className="w-4 h-4" />,
    medium: <AlertTriangle className="w-4 h-4" />,
    high: <Shield className="w-4 h-4" />,
    critical: <Shield className="w-4 h-4" />
  }

  const handleResolve = async () => {
    if (onResolve) {
      onResolve(anomaly.id)
    }
  }

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="w-8 h-8 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center flex-shrink-0">
        {anomaly.avatar_url ? (
          <img 
            src={anomaly.avatar_url} 
            alt={anomaly.student}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <Shield className="w-4 h-4 text-error-600 dark:text-error-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {anomaly.student}
          </p>
          <Badge 
            variant={severityColors[anomaly.severity]} 
            size="sm"
            icon={severityIcons[anomaly.severity]}
          >
            {anomaly.severity.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {anomaly.message}
        </p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {anomaly.time} • {anomaly.date}
          </p>
          {!anomaly.resolved && onResolve && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResolve}
              className="text-xs"
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState('today')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([])
  const [anomalies, setAnomalies] = useState<DashboardAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch all dashboard data in parallel
      const [statsResponse, activityResponse, anomaliesResponse] = await Promise.all([
        dashboardService.getFormattedStats(timeRange),
        dashboardService.getRecentActivity(5),
        dashboardService.getAnomalies(5, false)
      ])

      setDashboardData(statsResponse)
      
      if (activityResponse.success && activityResponse.data) {
        setRecentActivity(activityResponse.data)
      }
      
      if (anomaliesResponse.success && anomaliesResponse.data) {
        setAnomalies(anomaliesResponse.data)
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleResolveAnomaly = async (anomalyId: string) => {
    try {
      const response = await dashboardService.resolveAnomaly(anomalyId, true)
      if (response.success) {
        // Remove the resolved anomaly from the list
        setAnomalies(prev => prev.filter(a => a.id !== anomalyId))
      }
    } catch (error) {
      console.error('Failed to resolve anomaly:', error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const stats = dashboardData ? [
    {
      title: 'Total Students',
      value: dashboardData.totalStudents.toLocaleString(),
      change: '+12 this week',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'primary' as const,
      trend: 'up' as const
    },
    {
      title: 'Present Today',
      value: dashboardData.presentToday.toLocaleString(),
      change: `${dashboardData.attendanceRate}% rate`,
      icon: <UserCheck className="w-6 h-6" />,
      color: 'success' as const,
      trend: dashboardData.attendanceTrend === 'up' ? 'up' as const : 
             dashboardData.attendanceTrend === 'down' ? 'down' as const : 'neutral' as const
    },
    {
      title: 'Absent Today',
      value: dashboardData.absentToday.toLocaleString(),
      change: dashboardData.attendanceTrend === 'up' ? '-5% from yesterday' : 
              dashboardData.attendanceTrend === 'down' ? '+5% from yesterday' : 'No change',
      icon: <UserX className="w-6 h-6" />,
      color: 'warning' as const,
      trend: dashboardData.attendanceTrend === 'up' ? 'down' as const : 
             dashboardData.attendanceTrend === 'down' ? 'up' as const : 'neutral' as const
    },
    {
      title: 'Active Teachers',
      value: dashboardData.activeTeachers.toString(),
      change: '+2 this month',
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
            <Button variant="primary" size="sm" icon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
          </div>
        </div>

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

          {/* Security Anomalies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Alerts
                  </h3>
                  <Badge variant="error" size="sm">
                    {anomalies.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody className="space-y-1">
                {loading ? (
                  // Loading skeleton for anomalies
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 animate-pulse">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))
                ) : anomalies.length > 0 ? (
                  anomalies.map((anomaly) => (
                    <AnomalyItem 
                      key={anomaly.id} 
                      anomaly={anomaly} 
                      onResolve={handleResolveAnomaly}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No security alerts</p>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" size="sm" fullWidth>
                    View Security Dashboard
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
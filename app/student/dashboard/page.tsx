// app/student/dashboard/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  QrCode, 
  Calendar, 
  Clock, 
  BookOpen,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Camera,
  Scan,
  Award,
  Target,
  BarChart3,
  PieChart,
  Download,
  Bell,
  Settings,
  Eye,
  RefreshCw,
  Filter,
  Search,
  GraduationCap,
  Users,
  Star,
  Loader2
} from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import QRScanner from '../../../components/student/QRScanner'
import AttendanceHistory from '../../../components/student/AttendanceHistory'
import { useAuth } from '../../../hooks/useAuth'
import studentService, { StudentStats, StudentSchedule } from '../../../services/studentService'

// Mock data for student dashboard
const mockStudentData = {
  todaySchedule: [
    { 
      id: 1, 
      name: 'Computer Science 101', 
      time: '09:00 AM - 10:30 AM', 
      room: 'Room 201',
      teacher: 'Prof. David Wilson',
      status: 'present',
      attendedAt: '09:05 AM'
    },
    { 
      id: 2, 
      name: 'Data Structures', 
      time: '11:00 AM - 12:30 PM', 
      room: 'Room 305',
      teacher: 'Prof. Sarah Johnson',
      status: 'present',
      attendedAt: '11:02 AM'
    },
    { 
      id: 3, 
      name: 'Web Development', 
      time: '02:00 PM - 03:30 PM', 
      room: 'Lab 101',
      teacher: 'Prof. Michael Chen',
      status: 'upcoming',
      attendedAt: null
    },
    { 
      id: 4, 
      name: 'Database Systems', 
      time: '04:00 PM - 05:30 PM', 
      room: 'Room 402',
      teacher: 'Prof. Emily Davis',
      status: 'upcoming',
      attendedAt: null
    },
  ],
  attendanceStats: {
    totalClasses: 48,
    attended: 44,
    missed: 4,
    attendanceRate: 91.7,
    weeklyAttendance: [95, 90, 85, 92, 88, 94, 91.7],
    monthlyTrend: 'up'
  },
  recentAttendance: [
    { id: 1, course: 'Computer Science 101', date: 'Today', time: '09:05 AM', status: 'present' },
    { id: 2, course: 'Data Structures', date: 'Today', time: '11:02 AM', status: 'present' },
    { id: 3, course: 'Mathematics 201', date: 'Yesterday', time: '10:15 AM', status: 'present' },
    { id: 4, course: 'Physics 301', date: 'Yesterday', time: '02:30 PM', status: 'absent' },
    { id: 5, course: 'Chemistry 201', date: '2 days ago', time: '09:00 AM', status: 'present' },
  ],
  achievements: [
    { id: 1, title: 'Perfect Week', description: '100% attendance this week', icon: '🏆', earned: true },
    { id: 2, title: 'Early Bird', description: 'Attended 10 classes early', icon: '🌅', earned: true },
    { id: 3, title: 'Consistent Learner', description: '90%+ attendance for 3 months', icon: '📚', earned: false },
    { id: 4, title: 'Tech Enthusiast', description: 'Perfect attendance in CS courses', icon: '💻', earned: true },
  ]
}

const ClassCard = ({ classData }: { classData: any }) => {
  const [scannerOpen, setScannerOpen] = useState(false)
  
  const statusColors = {
    present: 'success',
    absent: 'error',
    upcoming: 'warning'
  } as const

  const statusIcons = {
    present: <CheckCircle className="w-4 h-4" />,
    absent: <XCircle className="w-4 h-4" />,
    upcoming: <Clock className="w-4 h-4" />
  }

  const canMarkAttendance = classData.status === 'upcoming' && 
    new Date().getHours() >= 8 && new Date().getHours() <= 17 // Mock time check

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {classData.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
              <Clock className="w-4 h-4 mr-1" />
              {classData.time}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
              <MapPin className="w-4 h-4 mr-1" />
              {classData.room}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {classData.teacher}
            </p>
          </div>
          <Badge 
            variant={statusColors[classData.status]} 
            icon={statusIcons[classData.status]}
          >
            {classData.status === 'present' ? 'Present' : 
             classData.status === 'absent' ? 'Absent' : 'Upcoming'}
          </Badge>
        </div>

        {classData.attendedAt && (
          <div className="mb-4 p-3 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
            <p className="text-sm text-success-800 dark:text-success-200 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Attended at {classData.attendedAt}
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          {canMarkAttendance && (
            <Button 
              variant="primary" 
              size="sm" 
              icon={<QrCode className="w-4 h-4" />}
              onClick={() => setScannerOpen(!scannerOpen)}
              fullWidth
            >
              {scannerOpen ? 'Close Scanner' : 'Scan QR Code'}
            </Button>
          )}
          {classData.status === 'present' && (
            <Button 
              variant="outline" 
              size="sm" 
              icon={<Eye className="w-4 h-4" />}
              fullWidth
            >
              View Details
            </Button>
          )}
          {classData.status === 'upcoming' && !canMarkAttendance && (
            <Button 
              variant="outline" 
              size="sm" 
              disabled
              fullWidth
            >
              Not Yet Available
            </Button>
          )}
        </div>

        {scannerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="text-center">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Camera View</p>
                  <p className="text-xs text-gray-400">Point camera at QR code</p>
                </div>
              </div>
              <div className="flex space-x-2 justify-center">
                <Button variant="primary" size="sm" icon={<Scan className="w-4 h-4" />}>
                  Start Scanning
                </Button>
                <Button variant="outline" size="sm" onClick={() => setScannerOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardBody>
    </Card>
  )
}

const AttendanceItem = ({ attendance }: { attendance: any }) => {
  const statusColors = {
    present: 'success',
    absent: 'error'
  } as const

  const statusIcons = {
    present: <CheckCircle className="w-4 h-4" />,
    absent: <XCircle className="w-4 h-4" />
  }

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className={`w-10 h-10 ${attendance.status === 'present' ? 'bg-success-100 dark:bg-success-900' : 'bg-error-100 dark:bg-error-900'} rounded-full flex items-center justify-center`}>
        {statusIcons[attendance.status]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {attendance.course}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {attendance.date} • {attendance.time}
        </p>
      </div>
      <Badge variant={statusColors[attendance.status]} size="sm">
        {attendance.status === 'present' ? 'Present' : 'Absent'}
      </Badge>
    </div>
  )
}

const AchievementCard = ({ achievement }: { achievement: any }) => (
  <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
    achievement.earned 
      ? 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20' 
      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
  }`}>
    <div className="text-center">
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <h4 className={`font-semibold mb-1 ${
        achievement.earned 
          ? 'text-success-800 dark:text-success-200' 
          : 'text-gray-600 dark:text-gray-400'
      }`}>
        {achievement.title}
      </h4>
      <p className={`text-sm ${
        achievement.earned 
          ? 'text-success-600 dark:text-success-300' 
          : 'text-gray-500 dark:text-gray-500'
      }`}>
        {achievement.description}
      </p>
      {achievement.earned && (
        <Badge variant="success" size="sm" className="mt-2">
          Earned
        </Badge>
      )}
    </div>
  </div>
)

export default function StudentDashboard() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null)
  const [studentSchedule, setStudentSchedule] = useState<StudentSchedule | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load student data
  useEffect(() => {
    if (user?.id) {
      loadStudentData()
    }
  }, [user?.id])

  const loadStudentData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const [stats, schedule] = await Promise.all([
        studentService.getStudentStats(user.id),
        studentService.getStudentSchedule(user.id)
      ])

      setStudentStats(stats)
      setStudentSchedule(schedule)
    } catch (err) {
      console.error('Failed to load student data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStudentData()
    setRefreshing(false)
  }

  const stats = [
    {
      title: 'Attendance Rate',
      value: studentStats ? `${studentStats.overall.attendanceRate}%` : '0%',
      change: studentStats ? `${studentStats.weekly.total} this week` : 'Loading...',
      icon: <Target className="w-6 h-6" />,
      color: 'success' as const
    },
    {
      title: 'Classes Attended',
      value: studentStats ? `${studentStats.overall.totalAttended}/${studentStats.overall.totalLectures}` : '0/0',
      change: studentStats ? `${studentStats.weekly.present + studentStats.weekly.late} this week` : 'Loading...',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'primary' as const
    },
    {
      title: 'Today\'s Classes',
      value: studentSchedule ? studentSchedule.todaysSchedule.length : 0,
      change: studentSchedule ? `${studentSchedule.statistics.attendedToday} completed` : 'Loading...',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'warning' as const
    },
    {
      title: 'Achievements',
      value: studentStats ? studentStats.achievements.length : 0,
      change: studentStats && studentStats.streaks.current > 0 ? `${studentStats.streaks.current} day streak` : 'No streak',
      icon: <Award className="w-6 h-6" />,
      color: 'success' as const
    }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'scanner', name: 'QR Scanner', icon: '📱' },
    { id: 'history', name: 'Attendance History', icon: '📋' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardBody className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {stat.value}
                          </p>
                          <p className="text-sm text-success-600 flex items-center mt-1">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {stat.change}
                          </p>
                        </div>
                        <div className={`w-12 h-12 bg-${stat.color}-500 rounded-lg flex items-center justify-center text-white`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Today's Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Today's Schedule
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
                        Refresh
                      </Button>
                      <Button variant="ghost" size="sm" icon={<Calendar className="w-4 h-4" />}>
                        Full Schedule
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {studentSchedule && studentSchedule.todaysSchedule.length > 0 ? (
                      studentSchedule.todaysSchedule.map((scheduleItem, index) => (
                        <motion.div
                          key={scheduleItem.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                        >
                          <Card className="hover:shadow-lg transition-all duration-200">
                            <CardBody className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {scheduleItem.course.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {new Date(scheduleItem.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(scheduleItem.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {scheduleItem.location || 'Location TBD'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                    <BookOpen className="w-4 h-4 mr-1" />
                                    {scheduleItem.course.code}
                                  </p>
                                </div>
                                <Badge 
                                  variant={
                                    scheduleItem.status === 'present' || scheduleItem.status === 'late' ? 'success' :
                                    scheduleItem.status === 'absent' || scheduleItem.status === 'missed' ? 'error' : 'warning'
                                  }
                                  icon={
                                    scheduleItem.status === 'present' || scheduleItem.status === 'late' ? <CheckCircle className="w-4 h-4" /> :
                                    scheduleItem.status === 'absent' || scheduleItem.status === 'missed' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
                                  }
                                >
                                  {scheduleItem.status === 'present' ? 'Present' : 
                                   scheduleItem.status === 'late' ? 'Late' :
                                   scheduleItem.status === 'absent' ? 'Absent' : 
                                   scheduleItem.status === 'missed' ? 'Missed' : 'Upcoming'}
                                </Badge>
                              </div>
                              {scheduleItem.attendance && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Marked at: {new Date(scheduleItem.attendance.markedAt).toLocaleTimeString()}
                                </div>
                              )}
                              {scheduleItem.status === 'upcoming' || scheduleItem.status === 'ongoing' ? (
                                <div className="mt-4">
                                  <Button 
                                    variant="primary" 
                                    size="sm" 
                                    icon={<QrCode className="w-4 h-4" />}
                                    onClick={() => setActiveTab('scanner')}
                                    className="w-full"
                                  >
                                    Mark Attendance
                                  </Button>
                                </div>
                              ) : null}
                            </CardBody>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">No classes scheduled for today</p>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Recent Activity and Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Attendance */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Recent Attendance
                      </h3>
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-2">
                      {mockStudentData.recentAttendance.slice(0, 5).map((attendance) => (
                        <AttendanceItem key={attendance.id} attendance={attendance} />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Achievements
                      </h3>
                      <Button variant="ghost" size="sm" icon={<Star className="w-4 h-4" />}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      {mockStudentData.achievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>
          </div>
        )
      case 'scanner':
        return <QRScanner studentId={user?.id} onAttendanceMarked={handleRefresh} />
      case 'history':
        return <AttendanceHistory studentId={user?.id} period={selectedPeriod} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadStudentData} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Student Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name}. Track your attendance and progress.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="form-select"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
            </select>
            <Button 
              variant="outline" 
              size="sm" 
              icon={refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<QrCode className="w-4 h-4" />}
              onClick={() => setActiveTab('scanner')}
            >
              Quick Scan
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </DashboardLayout>
  )
}
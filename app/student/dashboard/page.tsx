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
  Star
} from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../hooks/useAuth'

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

  const stats = [
    {
      title: 'Attendance Rate',
      value: `${mockStudentData.attendanceStats.attendanceRate}%`,
      change: '+2.3% this month',
      icon: <Target className="w-6 h-6" />,
      color: 'success' as const
    },
    {
      title: 'Classes Attended',
      value: `${mockStudentData.attendanceStats.attended}/${mockStudentData.attendanceStats.totalClasses}`,
      change: '+3 this week',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'primary' as const
    },
    {
      title: 'Today\'s Classes',
      value: mockStudentData.todaySchedule.length,
      change: '2 completed',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'warning' as const
    },
    {
      title: 'Achievements',
      value: mockStudentData.achievements.filter(a => a.earned).length,
      change: '+1 this week',
      icon: <Award className="w-6 h-6" />,
      color: 'success' as const
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
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
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            <Button variant="primary" size="sm" icon={<QrCode className="w-4 h-4" />}>
              Quick Scan
            </Button>
          </div>
        </div>

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
                {mockStudentData.todaySchedule.map((classData, index) => (
                  <motion.div
                    key={classData.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  >
                    <ClassCard classData={classData} />
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Analytics and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Analytics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
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
                    <Button variant="ghost" size="sm" icon={<PieChart className="w-4 h-4" />}>
                      Pie
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {mockStudentData.attendanceStats.attendanceRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-success-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${mockStudentData.attendanceStats.attendanceRate}%` }}
                    />
                  </div>
                </div>
                <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Weekly attendance chart
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Chart integration pending
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Recent Attendance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Recent Attendance
                  </h3>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="space-y-1">
                {mockStudentData.recentAttendance.map((attendance) => (
                  <AttendanceItem key={attendance.id} attendance={attendance} />
                ))}
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Achievements
                </h3>
                <Badge variant="primary" size="sm">
                  {mockStudentData.achievements.filter(a => a.earned).length} / {mockStudentData.achievements.length}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockStudentData.achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                  >
                    <AchievementCard achievement={achievement} />
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
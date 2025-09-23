// app/teacher/dashboard/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  QrCode, 
  Users, 
  Calendar, 
  Clock, 
  BookOpen,
  TrendingUp,
  UserCheck,
  UserX,
  MapPin,
  Download,
  Plus,
  Eye,
  Settings,
  RefreshCw,
  Share2,
  Filter,
  Search,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useAuth } from '../../../hooks/useAuth'

// Mock data for teacher dashboard
const mockTeacherData = {
  todayClasses: [
    { 
      id: 1, 
      name: 'Computer Science 101', 
      time: '09:00 AM - 10:30 AM', 
      room: 'Room 201',
      enrolled: 45,
      present: 42,
      status: 'completed',
      qrGenerated: true
    },
    { 
      id: 2, 
      name: 'Data Structures', 
      time: '11:00 AM - 12:30 PM', 
      room: 'Room 305',
      enrolled: 38,
      present: 35,
      status: 'active',
      qrGenerated: true
    },
    { 
      id: 3, 
      name: 'Web Development', 
      time: '02:00 PM - 03:30 PM', 
      room: 'Lab 101',
      enrolled: 32,
      present: 0,
      status: 'upcoming',
      qrGenerated: false
    },
  ],
  weeklyStats: {
    totalClasses: 12,
    averageAttendance: 89.2,
    totalStudents: 115,
    presentStudents: 103
  },
  recentAttendance: [
    { id: 1, student: 'Alex Johnson', course: 'CS 101', time: '09:15 AM', status: 'present', location: 'Room 201' },
    { id: 2, student: 'Sarah Davis', course: 'Data Structures', time: '11:05 AM', status: 'present', location: 'Room 305' },
    { id: 3, student: 'Mike Wilson', course: 'CS 101', time: '09:12 AM', status: 'present', location: 'Room 201' },
    { id: 4, student: 'Emma Brown', course: 'Data Structures', time: '11:03 AM', status: 'present', location: 'Room 305' },
  ]
}

const ClassCard = ({ classData }: { classData: any }) => {
  const [qrVisible, setQrVisible] = useState(false)
  
  const statusColors = {
    completed: 'success',
    active: 'primary',
    upcoming: 'warning'
  } as const

  const statusIcons = {
    completed: <CheckCircle2 className="w-4 h-4" />,
    active: <Clock className="w-4 h-4" />,
    upcoming: <Calendar className="w-4 h-4" />
  }

  const attendanceRate = classData.enrolled > 0 ? (classData.present / classData.enrolled * 100).toFixed(1) : 0

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {classData.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {classData.time}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {classData.room}
            </p>
          </div>
          <Badge 
            variant={statusColors[classData.status]} 
            icon={statusIcons[classData.status]}
          >
            {classData.status.charAt(0).toUpperCase() + classData.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {classData.present}/{classData.enrolled}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Present</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {attendanceRate}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rate</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {classData.status === 'upcoming' && (
            <Button 
              variant="primary" 
              size="sm" 
              icon={<QrCode className="w-4 h-4" />}
              fullWidth
            >
              Generate QR Code
            </Button>
          )}
          {classData.status === 'active' && (
            <>
              <Button 
                variant="primary" 
                size="sm" 
                icon={<QrCode className="w-4 h-4" />}
                onClick={() => setQrVisible(!qrVisible)}
              >
                {qrVisible ? 'Hide QR' : 'Show QR'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </>
          )}
          {classData.status === 'completed' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Eye className="w-4 h-4" />}
              >
                View Report
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </Button>
            </>
          )}
        </div>

        {qrVisible && classData.status === 'active' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
          >
            <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              QR Code for {classData.name}
            </p>
            <div className="flex space-x-2 justify-center">
              <Button variant="outline" size="xs" icon={<Share2 className="w-3 h-3" />}>
                Share
              </Button>
              <Button variant="outline" size="xs" icon={<Download className="w-3 h-3" />}>
                Download
              </Button>
            </div>
          </motion.div>
        )}
      </CardBody>
    </Card>
  )
}

const AttendanceItem = ({ attendance }: { attendance: any }) => (
  <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
    <div className="w-10 h-10 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center">
      <UserCheck className="w-5 h-5 text-success-600 dark:text-success-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {attendance.student}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
        {attendance.course} • {attendance.location}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-900 dark:text-gray-100">{attendance.time}</p>
      <Badge variant="success" size="sm">Present</Badge>
    </div>
  </div>
)

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  const stats = [
    {
      title: 'Today\'s Classes',
      value: mockTeacherData.todayClasses.length,
      change: '+1 from yesterday',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'primary' as const
    },
    {
      title: 'Total Students',
      value: mockTeacherData.weeklyStats.totalStudents,
      change: '+5 this week',
      icon: <Users className="w-6 h-6" />,
      color: 'success' as const
    },
    {
      title: 'Average Attendance',
      value: `${mockTeacherData.weeklyStats.averageAttendance}%`,
      change: '+2.3% this week',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'success' as const
    },
    {
      title: 'Active QR Codes',
      value: mockTeacherData.todayClasses.filter(c => c.qrGenerated && c.status === 'active').length,
      change: 'Real-time',
      icon: <QrCode className="w-6 h-6" />,
      color: 'warning' as const
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Teacher Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name}. Manage your classes and track attendance.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" icon={<Calendar className="w-4 h-4" />}>
              Schedule
            </Button>
            <Button variant="outline" size="sm" icon={<BarChart3 className="w-4 h-4" />}>
              Reports
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Class
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

        {/* Today's Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Today's Classes
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" icon={<Filter className="w-4 h-4" />}>
                    Filter
                  </Button>
                  <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTeacherData.todayClasses.map((classData, index) => (
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
                    Attendance Analytics
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
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Weekly attendance trends
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
                {mockTeacherData.recentAttendance.map((attendance) => (
                  <AttendanceItem key={attendance.id} attendance={attendance} />
                ))}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" size="sm" fullWidth icon={<Eye className="w-4 h-4" />}>
                    View Detailed Reports
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Actions
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" icon={<QrCode className="w-4 h-4" />}>
                  Generate QR
                </Button>
                <Button variant="outline" icon={<Users className="w-4 h-4" />}>
                  View Students
                </Button>
                <Button variant="outline" icon={<Calendar className="w-4 h-4" />}>
                  Schedule Class
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export Data
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
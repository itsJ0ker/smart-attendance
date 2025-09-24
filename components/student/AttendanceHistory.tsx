// components/student/AttendanceHistory.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  MapPin, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Search,
  RefreshCw,
  User,
  Award,
  Target
} from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import studentService, { AttendanceHistory as AttendanceHistoryType } from '../../services/studentService'

interface AttendanceRecord {
  id: string
  lecture_id: string
  student_id: string
  status: 'present' | 'late' | 'absent'
  marked_at?: string
  location?: string
  device_info?: string
  ip_address?: string
  created_at: string
  lecture: {
    id: string
    title: string
    scheduled_at: string
    duration_minutes: number
    location?: string
    subject: {
      name: string
      code: string
    }
    course: {
      name: string
      code: string
    }
    teacher: {
      name: string
    }
  }
}

interface AttendanceStats {
  total_lectures: number
  attended: number
  late: number
  absent: number
  attendance_rate: number
  punctuality_rate: number
  streak: {
    current: number
    longest: number
  }
  monthly_stats: {
    month: string
    attendance_rate: number
    total_lectures: number
    attended: number
  }[]
  subject_stats: {
    subject_name: string
    subject_code: string
    attendance_rate: number
    total_lectures: number
    attended: number
  }[]
}

export default function AttendanceHistory() {
  const { user } = useAuth()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('month')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list')
  const recordsPerPage = 10

  useEffect(() => {
    if (user) {
      fetchAttendanceHistory()
      fetchAttendanceStats()
    }
  }, [user, currentPage, statusFilter, subjectFilter, dateRange])

  const fetchAttendanceHistory = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams({
        studentId: user.id,
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(subjectFilter !== 'all' && { subject: subjectFilter }),
        ...(dateRange !== 'all' && { dateRange })
      })

      const response = await fetch(`/api/attendance/history?${params}`)
      const result = await response.json()

      if (result.success) {
        setAttendanceRecords(result.data.records)
        setTotalPages(Math.ceil(result.data.total / recordsPerPage))
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceStats = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams({
        studentId: user.id,
        ...(dateRange !== 'all' && { dateRange })
      })

      const response = await fetch(`/api/attendance/stats?${params}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
    }
  }

  const exportAttendance = async () => {
    try {
      const params = new URLSearchParams({
        studentId: user?.id || '',
        ...(dateRange !== 'all' && { dateRange })
      })

      const response = await fetch(`/api/attendance/export?${params}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting attendance:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present': return 'success'
      case 'late': return 'warning'
      case 'absent': return 'error'
      default: return 'secondary'
    }
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.lecture.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.lecture.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getAchievementBadges = () => {
    if (!stats) return []
    
    const badges = []
    
    if (stats.attendance_rate >= 95) {
      badges.push({ name: 'Perfect Attendance', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' })
    }
    if (stats.attendance_rate >= 90) {
      badges.push({ name: 'Excellent Attendance', icon: '⭐', color: 'bg-blue-100 text-blue-800' })
    }
    if (stats.punctuality_rate >= 95) {
      badges.push({ name: 'Always On Time', icon: '⏰', color: 'bg-green-100 text-green-800' })
    }
    if (stats.streak.current >= 10) {
      badges.push({ name: 'Attendance Streak', icon: '🔥', color: 'bg-orange-100 text-orange-800' })
    }
    
    return badges
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance History</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your attendance and performance</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3 py-1"
            >
              List
            </Button>
            <Button
              variant={viewMode === 'stats' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('stats')}
              className="px-3 py-1"
            >
              Stats
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAttendance}
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                <p className={`text-2xl font-bold ${getAttendanceRateColor(stats.attendance_rate)}`}>
                  {stats.attendance_rate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Lectures</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_lectures}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">{stats.streak.current}</p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Punctuality</p>
                <p className={`text-2xl font-bold ${getAttendanceRateColor(stats.punctuality_rate)}`}>
                  {stats.punctuality_rate.toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badges */}
      {getAchievementBadges().length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {getAchievementBadges().map((badge, index) => (
              <div
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color} flex items-center space-x-1`}
              >
                <span>{badge.icon}</span>
                <span>{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'stats' && stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Trend</h3>
            <div className="space-y-3">
              {stats.monthly_stats.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{month.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${month.attendance_rate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12">
                      {month.attendance_rate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject-wise Performance */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Subject Performance</h3>
            <div className="space-y-3">
              {stats.subject_stats.map((subject, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{subject.subject_name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({subject.subject_code})</span>
                    </div>
                    <span className={`font-semibold ${getAttendanceRateColor(subject.attendance_rate)}`}>
                      {subject.attendance_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${subject.attendance_rate}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {subject.attended} of {subject.total_lectures} lectures attended
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search lectures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="semester">This Semester</option>
                  <option value="all">All Time</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>

                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="all">All Subjects</option>
                  {stats?.subject_stats.map((subject) => (
                    <option key={subject.subject_code} value={subject.subject_code}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="space-y-0">
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(record.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {record.lecture.title}
                          </h3>
                          <Badge variant={getStatusBadgeColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{record.lecture.subject.name} ({record.lecture.subject.code})</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{record.lecture.teacher.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(record.lecture.scheduled_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(record.lecture.scheduled_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} ({record.lecture.duration_minutes}min)
                            </span>
                          </div>
                          {record.lecture.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{record.lecture.location}</span>
                            </div>
                          )}
                        </div>

                        {record.marked_at && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Marked at: {new Date(record.marked_at).toLocaleString()}
                            {record.location && ` • Location: ${record.location}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No attendance records found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
// components/teacher/ClassManagement.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  Clock, 
  QrCode, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX,
  Download,
  Filter,
  Search,
  MoreVertical,
  BookOpen,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import QRGenerator from './QRGenerator'
import { useAuth } from '../../hooks/useAuth'

interface Lecture {
  id: string
  subject_id: string
  course_id: string
  teacher_id: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes: number
  location?: string
  qr_code?: string
  qr_expires_at?: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_at: string
  subject?: {
    name: string
    code: string
  }
  course?: {
    name: string
    code: string
  }
  attendance_stats?: {
    total_students: number
    present: number
    late: number
    absent: number
    attendance_rate: number
  }
}

interface Student {
  id: string
  name: string
  email: string
  student_id: string
  avatar_url?: string
  attendance_status?: 'present' | 'late' | 'absent'
  marked_at?: string
  location?: string
}

export default function ClassManagement() {
  const { user } = useAuth()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStudentsList, setShowStudentsList] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')

  useEffect(() => {
    fetchLectures()
  }, [dateFilter, statusFilter])

  useEffect(() => {
    if (selectedLecture) {
      fetchLectureStudents(selectedLecture.id)
    }
  }, [selectedLecture])

  const fetchLectures = async () => {
    if (!user) return

    try {
      const params = new URLSearchParams({
        teacherId: user.id,
        ...(dateFilter !== 'all' && { date: dateFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/lectures/schedule?${params}`)
      const result = await response.json()

      if (result.success) {
        setLectures(result.data)
      }
    } catch (error) {
      console.error('Error fetching lectures:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLectureStudents = async (lectureId: string) => {
    try {
      const response = await fetch(`/api/lectures/${lectureId}/students`)
      const result = await response.json()

      if (result.success) {
        setStudents(result.data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const generateQRCode = (lecture: Lecture) => {
    setSelectedLecture(lecture)
    setShowQRGenerator(true)
  }

  const markManualAttendance = async (studentId: string, status: 'present' | 'late' | 'absent') => {
    if (!selectedLecture) return

    try {
      const response = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lectureId: selectedLecture.id,
          studentId,
          status,
          teacherId: user?.id
        })
      })

      if (response.ok) {
        fetchLectureStudents(selectedLecture.id)
        fetchLectures() // Refresh to update stats
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
    }
  }

  const updateLectureStatus = async (lectureId: string, status: string) => {
    try {
      const response = await fetch(`/api/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchLectures()
      }
    } catch (error) {
      console.error('Error updating lecture status:', error)
    }
  }

  const exportAttendance = async (lectureId: string) => {
    try {
      const response = await fetch(`/api/lectures/${lectureId}/export`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-${lectureId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting attendance:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'secondary'
      case 'active': return 'success'
      case 'completed': return 'primary'
      case 'cancelled': return 'error'
      default: return 'secondary'
    }
  }

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600'
      case 'late': return 'text-yellow-600'
      case 'absent': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />
      case 'late': return <Clock className="w-4 h-4" />
      case 'absent': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredLectures = lectures.filter(lecture => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lecture.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lecture.course?.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const isLectureActive = (lecture: Lecture) => {
    const now = new Date()
    const scheduledTime = new Date(lecture.scheduled_at)
    const endTime = new Date(scheduledTime.getTime() + lecture.duration_minutes * 60000)
    return now >= scheduledTime && now <= endTime
  }

  const canGenerateQR = (lecture: Lecture) => {
    return lecture.status === 'scheduled' || lecture.status === 'active'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Class Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your lectures and attendance</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStudentsList(!showStudentsList)}
            icon={<Users className="w-4 h-4" />}
          >
            {showStudentsList ? 'Hide Students' : 'Show Students'}
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Lecture
          </Button>
        </div>
      </div>

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
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lectures List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredLectures.map((lecture) => (
            <motion.div
              key={lecture.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 cursor-pointer transition-all ${
                selectedLecture?.id === lecture.id
                  ? 'border-primary-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedLecture(lecture)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {lecture.title}
                    </h3>
                    <Badge variant={getStatusBadgeColor(lecture.status)}>
                      {lecture.status}
                    </Badge>
                    {isLectureActive(lecture) && (
                      <Badge variant="success" className="animate-pulse">
                        Live
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{lecture.subject?.name} ({lecture.subject?.code})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{lecture.course?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(lecture.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(lecture.scheduled_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} ({lecture.duration_minutes}min)
                      </span>
                    </div>
                    {lecture.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{lecture.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {canGenerateQR(lecture) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        generateQRCode(lecture)
                      }}
                      icon={<QrCode className="w-4 h-4" />}
                    >
                      QR Code
                    </Button>
                  )}
                  
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<MoreVertical className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Stats */}
              {lecture.attendance_stats && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {lecture.attendance_stats.total_students}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {lecture.attendance_stats.present}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-yellow-600">
                        {lecture.attendance_stats.late}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Late</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">
                        {lecture.attendance_stats.absent}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Absent</div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {lecture.attendance_stats.attendance_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${lecture.attendance_stats.attendance_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {filteredLectures.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No lectures found</p>
            </div>
          )}
        </div>

        {/* Students Panel */}
        {showStudentsList && selectedLecture && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Students
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportAttendance(selectedLecture.id)}
                  icon={<Download className="w-4 h-4" />}
                >
                  Export
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {student.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {student.student_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {student.attendance_status ? (
                      <div className={`flex items-center space-x-1 ${getAttendanceStatusColor(student.attendance_status)}`}>
                        {getAttendanceIcon(student.attendance_status)}
                        <span className="text-xs font-medium">
                          {student.attendance_status}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markManualAttendance(student.id, 'present')}
                          className="text-green-600 hover:text-green-700 px-2 py-1 text-xs"
                        >
                          Present
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markManualAttendance(student.id, 'late')}
                          className="text-yellow-600 hover:text-yellow-700 px-2 py-1 text-xs"
                        >
                          Late
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markManualAttendance(student.id, 'absent')}
                          className="text-red-600 hover:text-red-700 px-2 py-1 text-xs"
                        >
                          Absent
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {students.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No students enrolled
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Generator Modal */}
      {showQRGenerator && selectedLecture && (
        <QRGenerator
          isOpen={showQRGenerator}
          onClose={() => setShowQRGenerator(false)}
          lectureId={selectedLecture.id}
          lectureName={selectedLecture.title}
          onSuccess={() => {
            fetchLectures() // Refresh to get updated QR info
          }}
        />
      )}
    </div>
  )
}
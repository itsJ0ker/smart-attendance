// components/admin/Analytics.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  RefreshCw,
  Eye,
  PieChart,
  Activity,
  Target,
  Award,
  Zap
} from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

interface AnalyticsData {
  overview: {
    total_students: number
    total_teachers: number
    total_lectures: number
    total_attendance_records: number
    overall_attendance_rate: number
    active_users_today: number
    lectures_today: number
    attendance_trend: number // percentage change from last period
  }
  attendance_trends: {
    daily: {
      date: string
      attendance_rate: number
      total_lectures: number
      total_students: number
    }[]
    weekly: {
      week: string
      attendance_rate: number
      total_lectures: number
    }[]
    monthly: {
      month: string
      attendance_rate: number
      total_lectures: number
    }[]
  }
  department_stats: {
    department_name: string
    total_students: number
    total_teachers: number
    attendance_rate: number
    total_lectures: number
  }[]
  subject_performance: {
    subject_name: string
    subject_code: string
    attendance_rate: number
    total_lectures: number
    total_students: number
    avg_duration: number
  }[]
  teacher_performance: {
    teacher_name: string
    total_lectures: number
    avg_attendance_rate: number
    total_students: number
    subjects_taught: number
  }[]
  student_insights: {
    top_performers: {
      student_name: string
      student_id: string
      attendance_rate: number
      total_lectures: number
    }[]
    at_risk_students: {
      student_name: string
      student_id: string
      attendance_rate: number
      total_lectures: number
      consecutive_absences: number
    }[]
  }
  anomalies: {
    id: string
    type: 'suspicious_location' | 'multiple_devices' | 'rapid_scanning' | 'unusual_timing'
    description: string
    student_name: string
    lecture_title: string
    severity: 'low' | 'medium' | 'high'
    detected_at: string
    resolved: boolean
  }[]
  time_analysis: {
    peak_hours: {
      hour: number
      lecture_count: number
      attendance_rate: number
    }[]
    punctuality_stats: {
      on_time_rate: number
      late_rate: number
      average_delay_minutes: number
    }
  }
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'performance' | 'anomalies'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, selectedDepartment])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedDepartment !== 'all' && { department: selectedDepartment })
      })

      const response = await fetch(`/api/admin/analytics?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedDepartment !== 'all' && { department: selectedDepartment })
      })

      const response = await fetch(`/api/admin/analytics/export?${params}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting analytics:', error)
    }
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAttendanceRateBg = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800'
    if (rate >= 75) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">System-wide attendance insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
            <option value="year">This Year</option>
          </select>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Departments</option>
            {data.department_stats.map((dept) => (
              <option key={dept.department_name} value={dept.department_name}>
                {dept.department_name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={exportAnalytics}
            icon={<Download className="w-4 h-4" />}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <Button
          variant={viewMode === 'overview' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('overview')}
          className="px-4 py-2"
        >
          Overview
        </Button>
        <Button
          variant={viewMode === 'trends' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('trends')}
          className="px-4 py-2"
        >
          Trends
        </Button>
        <Button
          variant={viewMode === 'performance' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('performance')}
          className="px-4 py-2"
        >
          Performance
        </Button>
        <Button
          variant={viewMode === 'anomalies' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('anomalies')}
          className="px-4 py-2"
        >
          Anomalies
        </Button>
      </div>

      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.overview.total_students.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Teachers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.overview.total_teachers.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lectures</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.overview.total_lectures.toLocaleString()}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</p>
                  <p className={`text-2xl font-bold ${getAttendanceRateColor(data.overview.overall_attendance_rate)}`}>
                    {data.overview.overall_attendance_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                  {getTrendIcon(data.overview.attendance_trend)}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.overview.active_users_today.toLocaleString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-teal-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lectures Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.overview.lectures_today}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">On Time Rate</p>
                  <p className={`text-2xl font-bold ${getAttendanceRateColor(data.time_analysis.punctuality_stats.on_time_rate)}`}>
                    {data.time_analysis.punctuality_stats.on_time_rate.toFixed(1)}%
                  </p>
                </div>
                <Clock className="w-8 h-8 text-pink-500" />
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Department Performance</h3>
            <div className="space-y-4">
              {data.department_stats.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{dept.department_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getAttendanceRateBg(dept.attendance_rate)}`}>
                        {dept.attendance_rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{dept.total_students} students</span>
                      <span>{dept.total_teachers} teachers</span>
                      <span>{dept.total_lectures} lectures</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dept.attendance_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Attendance Trends Chart Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Attendance Trends</h3>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Chart visualization would go here</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* Peak Hours Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Peak Hours Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.time_analysis.peak_hours.slice(0, 8).map((hour, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {hour.hour}:00
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {hour.lecture_count} lectures
                    </div>
                    <div className={`text-sm font-medium ${getAttendanceRateColor(hour.attendance_rate)}`}>
                      {hour.attendance_rate.toFixed(1)}% attendance
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'performance' && (
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Award className="w-5 h-5 text-yellow-500 mr-2" />
                Top Performing Students
              </h3>
              <div className="space-y-3">
                {data.student_insights.top_performers.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{student.student_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{student.student_id}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getAttendanceRateColor(student.attendance_rate)}`}>
                        {student.attendance_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.total_lectures} lectures
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                At-Risk Students
              </h3>
              <div className="space-y-3">
                {data.student_insights.at_risk_students.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{student.student_name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{student.student_id}</div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {student.consecutive_absences} consecutive absences
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {student.attendance_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {student.total_lectures} lectures
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Subject Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Subject</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Attendance Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Lectures</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Students</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subject_performance.map((subject, index) => (
                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{subject.subject_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{subject.subject_code}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${getAttendanceRateColor(subject.attendance_rate)}`}>
                          {subject.attendance_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.total_lectures}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.total_students}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.avg_duration}min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'anomalies' && (
        <div className="space-y-6">
          {/* Anomaly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Anomalies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.anomalies.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High Severity</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.anomalies.filter(a => a.severity === 'high').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.anomalies.filter(a => a.resolved).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {data.anomalies.filter(a => !a.resolved).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Anomalies List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Anomalies</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.anomalies.map((anomaly) => (
                <div key={anomaly.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={anomaly.resolved ? 'success' : 'warning'}>
                          {anomaly.resolved ? 'Resolved' : 'Pending'}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {anomaly.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{anomaly.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Student: {anomaly.student_name}</span>
                        <span>Lecture: {anomaly.lecture_title}</span>
                        <span>Detected: {new Date(anomaly.detected_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" icon={<Eye className="w-4 h-4" />}>
                        View
                      </Button>
                      {!anomaly.resolved && (
                        <Button variant="primary" size="sm">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {data.anomalies.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No anomalies detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// lib/services/dashboardService.ts
import { DashboardStats, ApiResponse } from '../../types'

export interface DashboardActivity {
  id: string
  student: string
  student_id: string
  course: string
  lecture_title: string
  time: string
  status: string
  avatar_url?: string
  marked_at: string
}

export interface DashboardAnomaly {
  id: string
  type: string
  student: string
  user_role: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  time: string
  date: string
  resolved: boolean
  metadata?: Record<string, any>
  avatar_url?: string
  created_at: string
}

export interface AttendanceTrend {
  date: string
  label: string
  attendance_percentage: number
  present_count: number
  late_count: number
  absent_count: number
  total_count: number
}

export interface AttendanceStatistics {
  total_records: number
  present_records: number
  late_records: number
  absent_records: number
  overall_percentage: number
  period_start: string
  period_end: string
}

export interface AttendanceTrendsData {
  trends: AttendanceTrend[]
  statistics: AttendanceStatistics
}

class DashboardService {
  private baseUrl = '/api/dashboard'

  async getStats(timeRange: string = 'today'): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await fetch(`${this.baseUrl}/stats?timeRange=${timeRange}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard stats')
      }
      
      return data
    } catch (error) {
      console.error('Dashboard stats fetch error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getRecentActivity(limit: number = 10): Promise<ApiResponse<DashboardActivity[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/recent-activity?limit=${limit}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent activity')
      }
      
      return data
    } catch (error) {
      console.error('Recent activity fetch error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getAnomalies(limit: number = 10, resolved: boolean = false): Promise<ApiResponse<DashboardAnomaly[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/anomalies?limit=${limit}&resolved=${resolved}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch anomalies')
      }
      
      return data
    } catch (error) {
      console.error('Anomalies fetch error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async resolveAnomaly(anomalyId: string, resolved: boolean = true, notes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/anomalies`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anomalyId,
          resolved,
          resolution_notes: notes
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update anomaly')
      }
      
      return data
    } catch (error) {
      console.error('Anomaly update error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getAttendanceTrends(timeRange: string = 'week'): Promise<ApiResponse<AttendanceTrendsData>> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance-trends?timeRange=${timeRange}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance trends')
      }
      
      return data
    } catch (error) {
      console.error('Attendance trends fetch error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Helper method to get formatted stats for display
  async getFormattedStats(timeRange: string = 'today') {
    const response = await this.getStats(timeRange)
    
    if (!response.success || !response.data) {
      return {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
        activeTeachers: 0,
        securityAlerts: 0,
        systemHealth: 'unknown' as const
      }
    }

    const stats = response.data
    const absentToday = stats.total_students - Math.round((stats.average_attendance / 100) * stats.total_students)
    const presentToday = stats.total_students - absentToday

    return {
      totalStudents: stats.total_students,
      presentToday: presentToday,
      absentToday: absentToday,
      attendanceRate: stats.average_attendance,
      activeTeachers: stats.total_teachers,
      securityAlerts: stats.security_alerts,
      systemHealth: stats.system_health,
      totalSubjects: stats.total_subjects,
      activeLectures: stats.active_lectures,
      attendanceTrend: stats.attendance_trend
    }
  }
}

export const dashboardService = new DashboardService()
export default dashboardService
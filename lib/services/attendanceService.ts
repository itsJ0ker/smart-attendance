// lib/services/attendanceService.ts
import { supabase } from '../supabase'
import { Database } from '../supabase'

type AttendanceRecord = Database['public']['Tables']['attendance']['Row']
type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']

export interface AttendanceStats {
  totalClasses: number
  attended: number
  missed: number
  attendanceRate: number
  weeklyAttendance: number[]
  monthlyTrend: 'up' | 'down' | 'stable'
}

export interface StudentAttendanceRecord {
  id: string
  course: string
  subject: string
  date: string
  time: string
  status: 'present' | 'absent' | 'late' | 'excused'
  room?: string
  teacher?: string
}

class AttendanceService {
  // Mark attendance via QR code
  async markAttendance(
    lectureId: string, 
    studentId: string, 
    qrCode: string,
    location?: { lat: number; lng: number },
    deviceInfo?: any
  ) {
    try {
      // First verify the QR code is valid and not expired
      const { data: lecture, error: lectureError } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', lectureId)
        .eq('qr_code', qrCode)
        .single()

      if (lectureError || !lecture) {
        return { success: false, error: 'Invalid QR code' }
      }

      // Check if QR code is expired
      if (lecture.qr_expires_at && new Date(lecture.qr_expires_at) < new Date()) {
        return { success: false, error: 'QR code has expired' }
      }

      // Check if student is enrolled in the course
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('course_id', lecture.course_id)
        .eq('student_id', studentId)
        .single()

      if (enrollmentError || !enrollment) {
        return { success: false, error: 'Student not enrolled in this course' }
      }

      // Check if attendance already marked
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('lecture_id', lectureId)
        .eq('student_id', studentId)
        .single()

      if (existingAttendance) {
        return { success: false, error: 'Attendance already marked for this lecture' }
      }

      // Determine status based on timing
      const now = new Date()
      const lectureStart = new Date(lecture.scheduled_at)
      const timeDiff = (now.getTime() - lectureStart.getTime()) / (1000 * 60) // minutes

      let status: 'present' | 'late' = 'present'
      if (timeDiff > 15) { // More than 15 minutes late
        status = 'late'
      }

      // Mark attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          lecture_id: lectureId,
          student_id: studentId,
          status,
          verification_method: 'qr_code',
          location_lat: location?.lat,
          location_lng: location?.lng,
          device_info: deviceInfo,
          marked_at: now.toISOString()
        })
        .select()
        .single()

      if (attendanceError) {
        return { success: false, error: 'Failed to mark attendance' }
      }

      // Log anomaly if marking attendance very late or very early
      if (timeDiff > 60 || timeDiff < -30) {
        await this.logAnomaly({
          type: 'unusual_attendance_timing',
          severity: timeDiff > 120 ? 'high' : 'medium',
          description: `Student marked attendance ${Math.abs(timeDiff).toFixed(0)} minutes ${timeDiff > 0 ? 'after' : 'before'} lecture start`,
          user_id: studentId,
          lecture_id: lectureId,
          data: { timeDiff, location, deviceInfo }
        })
      }

      return { success: true, data: attendance, status }
    } catch (error) {
      console.error('Error marking attendance:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get student attendance statistics
  async getStudentAttendanceStats(studentId: string, timeRange: 'week' | 'month' | 'semester' = 'month'): Promise<AttendanceStats> {
    try {
      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'semester':
          startDate = new Date(now.getFullYear(), now.getMonth() - 4, 1) // 4 months ago
          break
      }

      // Get all lectures for enrolled courses within time range
      const { data: lectures, error: lecturesError } = await supabase
        .from('lectures')
        .select(`
          id,
          scheduled_at,
          course_id,
          courses!inner(
            id,
            name,
            course_enrollments!inner(
              student_id
            )
          )
        `)
        .eq('courses.course_enrollments.student_id', studentId)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', now.toISOString())

      if (lecturesError) {
        throw lecturesError
      }

      const totalClasses = lectures?.length || 0

      // Get attendance records
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .in('lecture_id', lectures?.map(l => l.id) || [])

      if (attendanceError) {
        throw attendanceError
      }

      const attended = attendanceRecords?.filter(a => a.status === 'present' || a.status === 'late').length || 0
      const missed = totalClasses - attended
      const attendanceRate = totalClasses > 0 ? (attended / totalClasses) * 100 : 0

      // Calculate weekly attendance for the last 7 weeks
      const weeklyAttendance: number[] = []
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        
        const weekLectures = lectures?.filter(l => {
          const lectureDate = new Date(l.scheduled_at)
          return lectureDate >= weekStart && lectureDate < weekEnd
        }) || []

        const weekAttendance = attendanceRecords?.filter(a => {
          const attendanceDate = new Date(a.marked_at)
          return attendanceDate >= weekStart && attendanceDate < weekEnd && 
                 (a.status === 'present' || a.status === 'late')
        }) || []

        const weekRate = weekLectures.length > 0 ? (weekAttendance.length / weekLectures.length) * 100 : 0
        weeklyAttendance.push(Math.round(weekRate * 10) / 10)
      }

      // Determine monthly trend
      const lastWeekRate = weeklyAttendance[weeklyAttendance.length - 1] || 0
      const previousWeekRate = weeklyAttendance[weeklyAttendance.length - 2] || 0
      let monthlyTrend: 'up' | 'down' | 'stable' = 'stable'
      
      if (lastWeekRate > previousWeekRate + 2) {
        monthlyTrend = 'up'
      } else if (lastWeekRate < previousWeekRate - 2) {
        monthlyTrend = 'down'
      }

      return {
        totalClasses,
        attended,
        missed,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        weeklyAttendance,
        monthlyTrend
      }
    } catch (error) {
      console.error('Error getting attendance stats:', error)
      return {
        totalClasses: 0,
        attended: 0,
        missed: 0,
        attendanceRate: 0,
        weeklyAttendance: [0, 0, 0, 0, 0, 0, 0],
        monthlyTrend: 'stable'
      }
    }
  }

  // Get student attendance history
  async getStudentAttendanceHistory(studentId: string, limit: number = 10): Promise<StudentAttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          marked_at,
          lectures!inner(
            title,
            scheduled_at,
            room,
            courses!inner(
              name,
              subjects!inner(name)
            ),
            teachers!inner(
              users!inner(name)
            )
          )
        `)
        .eq('student_id', studentId)
        .order('marked_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data?.map(record => ({
        id: record.id,
        course: record.lectures.courses.name,
        subject: record.lectures.courses.subjects.name,
        date: new Date(record.marked_at).toLocaleDateString(),
        time: new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: record.status,
        room: record.lectures.room,
        teacher: record.lectures.teachers.users.name
      })) || []
    } catch (error) {
      console.error('Error getting attendance history:', error)
      return []
    }
  }

  // Get course attendance for teacher
  async getCourseAttendance(courseId: string, lectureId?: string) {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          id,
          status,
          marked_at,
          students!inner(
            student_id,
            users!inner(name, email, avatar_url)
          ),
          lectures!inner(
            id,
            title,
            scheduled_at,
            course_id
          )
        `)
        .eq('lectures.course_id', courseId)

      if (lectureId) {
        query = query.eq('lecture_id', lectureId)
      }

      const { data, error } = await query.order('marked_at', { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error getting course attendance:', error)
      return { success: false, error: 'Failed to fetch attendance data' }
    }
  }

  // Mark manual attendance (for teachers)
  async markManualAttendance(
    lectureId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    notes?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          lecture_id: lectureId,
          student_id: studentId,
          status,
          verification_method: 'manual',
          notes,
          marked_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error marking manual attendance:', error)
      return { success: false, error: 'Failed to mark attendance' }
    }
  }

  // Export attendance data
  async exportAttendanceData(
    courseId?: string,
    startDate?: string,
    endDate?: string,
    format: 'csv' | 'json' = 'csv'
  ) {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          id,
          status,
          marked_at,
          verification_method,
          notes,
          students!inner(
            student_id,
            users!inner(name, email)
          ),
          lectures!inner(
            title,
            scheduled_at,
            room,
            courses!inner(
              name,
              code,
              subjects!inner(name, code)
            )
          )
        `)

      if (courseId) {
        query = query.eq('lectures.course_id', courseId)
      }

      if (startDate) {
        query = query.gte('marked_at', startDate)
      }

      if (endDate) {
        query = query.lte('marked_at', endDate)
      }

      const { data, error } = await query.order('marked_at', { ascending: false })

      if (error) {
        throw error
      }

      if (format === 'csv') {
        const csvData = this.convertToCSV(data || [])
        return { success: true, data: csvData, format: 'csv' }
      }

      return { success: true, data, format: 'json' }
    } catch (error) {
      console.error('Error exporting attendance data:', error)
      return { success: false, error: 'Failed to export data' }
    }
  }

  // Helper method to convert data to CSV
  private convertToCSV(data: any[]): string {
    if (!data.length) return ''

    const headers = [
      'Student ID',
      'Student Name',
      'Email',
      'Course',
      'Subject',
      'Lecture',
      'Date',
      'Time',
      'Status',
      'Verification Method',
      'Room',
      'Notes'
    ]

    const rows = data.map(record => [
      record.students.student_id,
      record.students.users.name,
      record.students.users.email,
      record.lectures.courses.name,
      record.lectures.courses.subjects.name,
      record.lectures.title,
      new Date(record.marked_at).toLocaleDateString(),
      new Date(record.marked_at).toLocaleTimeString(),
      record.status,
      record.verification_method,
      record.lectures.room || '',
      record.notes || ''
    ])

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
  }

  // Log anomaly
  private async logAnomaly(anomaly: {
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    user_id?: string
    lecture_id?: string
    data?: any
  }) {
    try {
      await supabase
        .from('anomaly_logs')
        .insert(anomaly)
    } catch (error) {
      console.error('Error logging anomaly:', error)
    }
  }
}

export default new AttendanceService()
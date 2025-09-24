// services/studentService.ts
export interface StudentStats {
  overall: {
    totalLectures: number
    totalAttended: number
    attendanceRate: string
    present: number
    late: number
    absent: number
  }
  weekly: {
    total: number
    present: number
    late: number
    absent: number
  }
  monthly: {
    total: number
    present: number
    late: number
    absent: number
  }
  courseWise: Array<{
    courseId: string
    courseName: string
    courseCode: string
    total: number
    present: number
    late: number
    absent: number
    attendanceRate: string
  }>
  trend: Array<{
    date: string
    present: number
    late: number
    absent: number
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    earnedAt: string
  }>
  streaks: {
    current: number
    longest: number
  }
}

export interface ScheduleItem {
  id: string
  title: string
  startTime: string
  endTime: string
  location: string
  course: {
    id: string
    name: string
    code: string
  }
  attendance?: {
    id: string
    status: string
    markedAt: string
  }
  status: string
}

export interface StudentSchedule {
  date: string
  todaysSchedule: ScheduleItem[]
  upcomingLectures: ScheduleItem[]
  statistics: {
    totalToday: number
    attendedToday: number
    missedToday: number
    upcomingCount: number
  }
}

export interface AttendanceRecord {
  id: string
  status: string
  markedAt: string
  location?: string
  lecture: {
    id: string
    title: string
    startTime: string
    endTime: string
    course: {
      id: string
      name: string
      code: string
    }
  }
}

export interface AttendanceHistory {
  attendance: AttendanceRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  statistics: {
    total: number
    present: number
    late: number
    absent: number
    attendanceRate: string
  }
  period: {
    type: string
    startDate: string
    endDate: string
  }
}

export interface AttendanceMarkResponse {
  success: boolean
  attendance: {
    id: string
    status: string
    marked_at: string
    location?: string
  }
  lecture: {
    id: string
    title: string
    courseName: string
    startTime: string
    endTime: string
  }
  message: string
}

class StudentService {
  private baseUrl = '/api'

  async getStudentStats(studentId: string): Promise<StudentStats> {
    const response = await fetch(`${this.baseUrl}/students/${studentId}/stats`)
    if (!response.ok) {
      throw new Error('Failed to fetch student statistics')
    }
    return response.json()
  }

  async getStudentSchedule(studentId: string, date?: string): Promise<StudentSchedule> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    
    const response = await fetch(`${this.baseUrl}/students/${studentId}/schedule?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch student schedule')
    }
    return response.json()
  }

  async getAttendanceHistory(
    studentId: string, 
    period: string = 'week',
    page: number = 1,
    limit: number = 10
  ): Promise<AttendanceHistory> {
    const params = new URLSearchParams({
      period,
      page: page.toString(),
      limit: limit.toString()
    })
    
    const response = await fetch(`${this.baseUrl}/students/${studentId}/attendance?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch attendance history')
    }
    return response.json()
  }

  async markAttendance(
    qrCodeData: string,
    studentId: string,
    location?: string,
    deviceInfo?: string
  ): Promise<AttendanceMarkResponse> {
    const response = await fetch(`${this.baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qrCodeData,
        studentId,
        location,
        deviceInfo
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark attendance')
    }
    
    return data
  }

  // Helper method to get current location
  async getCurrentLocation(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve('Location not available')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        },
        (error) => {
          console.warn('Location access denied:', error)
          resolve('Location not available')
        },
        { timeout: 5000, enableHighAccuracy: false }
      )
    })
  }

  // Helper method to get device info
  getDeviceInfo(): string {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    return `${platform} - ${userAgent.substring(0, 100)}`
  }
}

export const studentService = new StudentService()
export default studentService
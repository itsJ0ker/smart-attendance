// services/teacherService.ts
export interface TeacherStats {
  todayClasses: number
  totalStudents: number
  averageAttendance: number
  activeQRCodes: number
  weeklyStats: {
    totalClasses: number
    averageAttendance: number
    totalStudents: number
    presentStudents: number
  }
}

export interface TodayClass {
  id: string
  name: string
  time: string
  room: string
  enrolled: number
  present: number
  status: 'completed' | 'active' | 'upcoming'
  qrGenerated: boolean
  course_id: string
  lecture_id?: string
}

export interface RecentAttendance {
  id: string
  student: string
  course: string
  time: string
  status: 'present' | 'late' | 'absent'
  location: string
  avatar_url?: string
}

export interface ClassStudent {
  id: string
  name: string
  email: string
  status: 'present' | 'late' | 'absent'
  marked_at?: string
  avatar_url?: string
}

class TeacherService {
  private baseUrl = '/api'

  async getTeacherStats(teacherId: string): Promise<TeacherStats> {
    try {
      const response = await fetch(`${this.baseUrl}/teachers/${teacherId}/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch teacher stats')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching teacher stats:', error)
      throw error
    }
  }

  async getTodayClasses(teacherId: string): Promise<TodayClass[]> {
    try {
      const response = await fetch(`${this.baseUrl}/teachers/${teacherId}/classes?date=${new Date().toISOString().split('T')[0]}`)
      if (!response.ok) {
        throw new Error('Failed to fetch today classes')
      }
      const data = await response.json()
      return data.classes || []
    } catch (error) {
      console.error('Error fetching today classes:', error)
      throw error
    }
  }

  async getRecentAttendance(teacherId: string, limit: number = 10): Promise<RecentAttendance[]> {
    try {
      const response = await fetch(`${this.baseUrl}/teachers/${teacherId}/recent-attendance?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recent attendance')
      }
      const data = await response.json()
      return data.attendance || []
    } catch (error) {
      console.error('Error fetching recent attendance:', error)
      throw error
    }
  }

  async generateQRCode(lectureId: string): Promise<{ qrCode: string; expiresAt: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/lectures/${lectureId}/qr`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }
      return await response.json()
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw error
    }
  }

  async regenerateQRCode(lectureId: string): Promise<{ qrCode: string; expiresAt: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/lectures/${lectureId}/qr`, {
        method: 'PUT'
      })
      if (!response.ok) {
        throw new Error('Failed to regenerate QR code')
      }
      return await response.json()
    } catch (error) {
      console.error('Error regenerating QR code:', error)
      throw error
    }
  }

  async getClassStudents(lectureId: string): Promise<ClassStudent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lectures/${lectureId}/students`)
      if (!response.ok) {
        throw new Error('Failed to fetch class students')
      }
      const data = await response.json()
      return data.students || []
    } catch (error) {
      console.error('Error fetching class students:', error)
      throw error
    }
  }

  async markManualAttendance(lectureId: string, studentId: string, status: 'present' | 'late' | 'absent'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lecture_id: lectureId,
          student_id: studentId,
          status
        })
      })
      if (!response.ok) {
        throw new Error('Failed to mark manual attendance')
      }
    } catch (error) {
      console.error('Error marking manual attendance:', error)
      throw error
    }
  }

  async exportAttendance(lectureId: string, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/attendance/export?lecture_id=${lectureId}&format=${format}`)
      if (!response.ok) {
        throw new Error('Failed to export attendance')
      }
      return await response.blob()
    } catch (error) {
      console.error('Error exporting attendance:', error)
      throw error
    }
  }

  async createLecture(courseId: string, lectureData: {
    title: string
    date: string
    start_time: string
    end_time: string
    room: string
    description?: string
  }): Promise<{ id: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseId}/lectures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lectureData)
      })
      if (!response.ok) {
        throw new Error('Failed to create lecture')
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating lecture:', error)
      throw error
    }
  }

  async getTeacherCourses(teacherId: string): Promise<Array<{
    id: string
    name: string
    code: string
    enrolled_count: number
    total_lectures: number
    average_attendance: number
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/teachers/${teacherId}/courses`)
      if (!response.ok) {
        throw new Error('Failed to fetch teacher courses')
      }
      const data = await response.json()
      return data.courses || []
    } catch (error) {
      console.error('Error fetching teacher courses:', error)
      throw error
    }
  }
}

export default new TeacherService()
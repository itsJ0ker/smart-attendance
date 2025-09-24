// services/adminService.ts
export interface AdminStats {
  totalStudents: number
  presentToday: number
  absentToday: number
  activeTeachers: number
  totalCourses: number
  totalLectures: number
  attendanceRate: number
  attendanceTrend: 'up' | 'down' | 'neutral'
}

export interface SystemUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  created_at: string
  last_login?: string
  status: 'active' | 'inactive' | 'suspended'
  avatar_url?: string
  courses_count?: number
  attendance_rate?: number
}

export interface CourseManagement {
  id: string
  name: string
  code: string
  teacher_name: string
  teacher_id: string
  enrolled_count: number
  total_lectures: number
  average_attendance: number
  created_at: string
  status: 'active' | 'inactive'
}

export interface AttendanceAnalytics {
  daily: Array<{
    date: string
    present: number
    absent: number
    late: number
    total: number
  }>
  weekly: Array<{
    week: string
    attendance_rate: number
    total_students: number
  }>
  monthly: Array<{
    month: string
    attendance_rate: number
    total_students: number
  }>
  by_course: Array<{
    course_name: string
    course_code: string
    attendance_rate: number
    total_students: number
  }>
}

export interface SystemActivity {
  id: string
  type: 'login' | 'attendance' | 'course_created' | 'user_created' | 'qr_generated'
  user_name: string
  user_role: string
  description: string
  timestamp: string
  metadata?: any
}

class AdminService {
  private baseUrl = '/api'

  async getAdminStats(timeRange: string = 'today'): Promise<AdminStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats?range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw error
    }
  }

  async getAllUsers(page: number = 1, limit: number = 20, role?: string, search?: string): Promise<{
    users: SystemUser[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      if (role) params.append('role', role)
      if (search) params.append('search', search)

      const response = await fetch(`${this.baseUrl}/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: 'admin' | 'teacher' | 'student'
  }): Promise<{ id: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      if (!response.ok) {
        throw new Error('Failed to create user')
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUser(userId: string, userData: Partial<SystemUser>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      if (!response.ok) {
        throw new Error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  async bulkCreateUsers(users: Array<{
    name: string
    email: string
    role: 'admin' | 'teacher' | 'student'
  }>): Promise<{ created: number; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users })
      })
      if (!response.ok) {
        throw new Error('Failed to bulk create users')
      }
      return await response.json()
    } catch (error) {
      console.error('Error bulk creating users:', error)
      throw error
    }
  }

  async getAllCourses(page: number = 1, limit: number = 20): Promise<{
    courses: CourseManagement[]
    total: number
    page: number
    totalPages: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/courses?page=${page}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
  }

  async createCourse(courseData: {
    name: string
    code: string
    teacher_id: string
    description?: string
  }): Promise<{ id: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      })
      if (!response.ok) {
        throw new Error('Failed to create course')
      }
      return await response.json()
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  }

  async getAttendanceAnalytics(timeRange: string = 'month'): Promise<AttendanceAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/analytics/attendance?range=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch attendance analytics')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching attendance analytics:', error)
      throw error
    }
  }

  async getSystemActivity(limit: number = 20): Promise<SystemActivity[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/activity?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch system activity')
      }
      const data = await response.json()
      return data.activities || []
    } catch (error) {
      console.error('Error fetching system activity:', error)
      throw error
    }
  }

  async exportUsers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/export?format=${format}`)
      if (!response.ok) {
        throw new Error('Failed to export users')
      }
      return await response.blob()
    } catch (error) {
      console.error('Error exporting users:', error)
      throw error
    }
  }

  async exportAttendance(
    startDate: string,
    endDate: string,
    courseId?: string,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        format
      })
      if (courseId) params.append('course_id', courseId)

      const response = await fetch(`${this.baseUrl}/admin/attendance/export?${params}`)
      if (!response.ok) {
        throw new Error('Failed to export attendance')
      }
      return await response.blob()
    } catch (error) {
      console.error('Error exporting attendance:', error)
      throw error
    }
  }

  async getSystemHealth(): Promise<{
    database: 'healthy' | 'warning' | 'error'
    api: 'healthy' | 'warning' | 'error'
    storage: 'healthy' | 'warning' | 'error'
    uptime: string
    version: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/health`)
      if (!response.ok) {
        throw new Error('Failed to fetch system health')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching system health:', error)
      throw error
    }
  }

  async suspendUser(userId: string, reason?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      if (!response.ok) {
        throw new Error('Failed to suspend user')
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      throw error
    }
  }

  async reactivateUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/reactivate`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to reactivate user')
      }
    } catch (error) {
      console.error('Error reactivating user:', error)
      throw error
    }
  }
}

export default new AdminService()
// lib/services/lectureService.ts
import { supabase } from '../supabase'
import { Database } from '../supabase'
import QRCode from 'qrcode'
import crypto from 'crypto'

type Lecture = Database['public']['Tables']['lectures']['Row']
type LectureInsert = Database['public']['Tables']['lectures']['Insert']

export interface LectureWithDetails {
  id: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes: number
  room?: string
  qr_code?: string
  qr_expires_at?: string
  is_active: boolean
  course: {
    id: string
    name: string
    code: string
    subject: {
      name: string
      code: string
    }
  }
  teacher: {
    name: string
    email: string
  }
  attendance_stats?: {
    total_enrolled: number
    present: number
    absent: number
    late: number
    attendance_rate: number
  }
}

export interface TodaySchedule {
  id: string
  name: string
  time: string
  room?: string
  teacher?: string
  status: 'completed' | 'active' | 'upcoming'
  enrolled?: number
  present?: number
  qrGenerated?: boolean
  attendedAt?: string
}

class LectureService {
  // Generate QR code for a lecture
  async generateQRCode(lectureId: string, teacherId: string, expirationMinutes: number = 30) {
    try {
      // Verify teacher owns this lecture
      const { data: lecture, error: lectureError } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', lectureId)
        .eq('teacher_id', teacherId)
        .single()

      if (lectureError || !lecture) {
        return { success: false, error: 'Lecture not found or access denied' }
      }

      // Generate unique QR code data
      const qrData = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000)

      // Update lecture with QR code
      const { error: updateError } = await supabase
        .from('lectures')
        .update({
          qr_code: qrData,
          qr_expires_at: expiresAt.toISOString(),
          is_active: true
        })
        .eq('id', lectureId)

      if (updateError) {
        return { success: false, error: 'Failed to generate QR code' }
      }

      // Generate QR code image
      const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/attendance/scan?lecture=${lectureId}&code=${qrData}`
      const qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      return {
        success: true,
        data: {
          qr_code: qrData,
          qr_code_image: qrCodeImage,
          qr_code_url: qrCodeUrl,
          expires_at: expiresAt.toISOString(),
          lecture_id: lectureId
        }
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get teacher's today schedule
  async getTeacherTodaySchedule(teacherId: string): Promise<TodaySchedule[]> {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data: lectures, error } = await supabase
        .from('lectures')
        .select(`
          id,
          title,
          scheduled_at,
          duration_minutes,
          room,
          qr_code,
          qr_expires_at,
          is_active,
          courses!inner(
            id,
            name,
            code,
            max_students,
            course_enrollments(count)
          )
        `)
        .eq('teacher_id', teacherId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lt('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) {
        throw error
      }

      const now = new Date()
      const schedulePromises = lectures?.map(async (lecture) => {
        const startTime = new Date(lecture.scheduled_at)
        const endTime = new Date(startTime.getTime() + lecture.duration_minutes * 60 * 1000)
        
        // Get attendance count
        const { count: presentCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('lecture_id', lecture.id)
          .in('status', ['present', 'late'])

        // Determine status
        let status: 'completed' | 'active' | 'upcoming' = 'upcoming'
        if (now > endTime) {
          status = 'completed'
        } else if (now >= startTime && now <= endTime) {
          status = 'active'
        }

        return {
          id: lecture.id,
          name: lecture.courses.name,
          time: `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          room: lecture.room,
          status,
          enrolled: lecture.courses.max_students,
          present: presentCount || 0,
          qrGenerated: !!lecture.qr_code && lecture.qr_expires_at ? new Date(lecture.qr_expires_at) > now : false
        }
      }) || []

      return await Promise.all(schedulePromises)
    } catch (error) {
      console.error('Error getting teacher schedule:', error)
      return []
    }
  }

  // Get student's today schedule
  async getStudentTodaySchedule(studentId: string): Promise<TodaySchedule[]> {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      const { data: lectures, error } = await supabase
        .from('lectures')
        .select(`
          id,
          title,
          scheduled_at,
          duration_minutes,
          room,
          courses!inner(
            id,
            name,
            code,
            course_enrollments!inner(
              student_id
            )
          ),
          teachers!inner(
            users!inner(name)
          )
        `)
        .eq('courses.course_enrollments.student_id', studentId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lt('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at', { ascending: true })

      if (error) {
        throw error
      }

      const now = new Date()
      const schedulePromises = lectures?.map(async (lecture) => {
        const startTime = new Date(lecture.scheduled_at)
        const endTime = new Date(startTime.getTime() + lecture.duration_minutes * 60 * 1000)
        
        // Check if student has marked attendance
        const { data: attendance } = await supabase
          .from('attendance')
          .select('marked_at, status')
          .eq('lecture_id', lecture.id)
          .eq('student_id', studentId)
          .single()

        // Determine status
        let status: 'present' | 'absent' | 'upcoming' = 'upcoming'
        let attendedAt: string | undefined

        if (attendance) {
          status = attendance.status === 'present' || attendance.status === 'late' ? 'present' : 'absent'
          attendedAt = new Date(attendance.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (now > endTime) {
          status = 'absent'
        }

        return {
          id: lecture.id,
          name: lecture.courses.name,
          time: `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          room: lecture.room,
          teacher: lecture.teachers.users.name,
          status,
          attendedAt
        }
      }) || []

      return await Promise.all(schedulePromises)
    } catch (error) {
      console.error('Error getting student schedule:', error)
      return []
    }
  }

  // Create new lecture
  async createLecture(lectureData: {
    course_id: string
    teacher_id: string
    title: string
    description?: string
    scheduled_at: string
    duration_minutes: number
    room?: string
  }) {
    try {
      // Get subject_id from course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('subject_id')
        .eq('id', lectureData.course_id)
        .single()

      if (courseError || !course) {
        return { success: false, error: 'Course not found' }
      }

      const { data: lecture, error } = await supabase
        .from('lectures')
        .insert({
          ...lectureData,
          subject_id: course.subject_id
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data: lecture }
    } catch (error) {
      console.error('Error creating lecture:', error)
      return { success: false, error: 'Failed to create lecture' }
    }
  }

  // Get lecture details with attendance stats
  async getLectureDetails(lectureId: string): Promise<LectureWithDetails | null> {
    try {
      const { data: lecture, error } = await supabase
        .from('lectures')
        .select(`
          id,
          title,
          description,
          scheduled_at,
          duration_minutes,
          room,
          qr_code,
          qr_expires_at,
          is_active,
          courses!inner(
            id,
            name,
            code,
            subjects!inner(
              name,
              code
            )
          ),
          teachers!inner(
            users!inner(
              name,
              email
            )
          )
        `)
        .eq('id', lectureId)
        .single()

      if (error || !lecture) {
        return null
      }

      // Get attendance stats
      const { data: attendanceStats } = await supabase
        .from('attendance')
        .select('status')
        .eq('lecture_id', lectureId)

      const { count: totalEnrolled } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', lecture.courses.id)

      const present = attendanceStats?.filter(a => a.status === 'present').length || 0
      const late = attendanceStats?.filter(a => a.status === 'late').length || 0
      const absent = (totalEnrolled || 0) - present - late

      return {
        id: lecture.id,
        title: lecture.title,
        description: lecture.description,
        scheduled_at: lecture.scheduled_at,
        duration_minutes: lecture.duration_minutes,
        room: lecture.room,
        qr_code: lecture.qr_code,
        qr_expires_at: lecture.qr_expires_at,
        is_active: lecture.is_active,
        course: {
          id: lecture.courses.id,
          name: lecture.courses.name,
          code: lecture.courses.code,
          subject: {
            name: lecture.courses.subjects.name,
            code: lecture.courses.subjects.code
          }
        },
        teacher: {
          name: lecture.teachers.users.name,
          email: lecture.teachers.users.email
        },
        attendance_stats: {
          total_enrolled: totalEnrolled || 0,
          present,
          absent,
          late,
          attendance_rate: totalEnrolled ? Math.round(((present + late) / totalEnrolled) * 100) : 0
        }
      }
    } catch (error) {
      console.error('Error getting lecture details:', error)
      return null
    }
  }

  // Deactivate QR code
  async deactivateQRCode(lectureId: string, teacherId: string) {
    try {
      const { error } = await supabase
        .from('lectures')
        .update({
          qr_code: null,
          qr_expires_at: null,
          is_active: false
        })
        .eq('id', lectureId)
        .eq('teacher_id', teacherId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error deactivating QR code:', error)
      return { success: false, error: 'Failed to deactivate QR code' }
    }
  }

  // Get upcoming lectures for a course
  async getUpcomingLectures(courseId: string, limit: number = 10) {
    try {
      const { data: lectures, error } = await supabase
        .from('lectures')
        .select(`
          id,
          title,
          scheduled_at,
          duration_minutes,
          room,
          is_active
        `)
        .eq('course_id', courseId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw error
      }

      return { success: true, data: lectures }
    } catch (error) {
      console.error('Error getting upcoming lectures:', error)
      return { success: false, error: 'Failed to fetch lectures' }
    }
  }

  // Validate QR code
  async validateQRCode(lectureId: string, qrCode: string) {
    try {
      const { data: lecture, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', lectureId)
        .eq('qr_code', qrCode)
        .single()

      if (error || !lecture) {
        return { success: false, error: 'Invalid QR code' }
      }

      // Check if expired
      if (lecture.qr_expires_at && new Date(lecture.qr_expires_at) < new Date()) {
        return { success: false, error: 'QR code has expired' }
      }

      return { success: true, data: lecture }
    } catch (error) {
      console.error('Error validating QR code:', error)
      return { success: false, error: 'Validation failed' }
    }
  }
}

export default new LectureService()
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'upcoming', 'completed'
    const date = searchParams.get('date')

    // Get teacher's courses and their lectures
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        description,
        created_at,
        lectures(
          id,
          title,
          start_time,
          end_time,
          location,
          qr_code_data,
          attendance(
            id,
            status,
            student_id
          )
        ),
        course_enrollments(
          id,
          students!inner(
            student_id,
            users!inner(id, name, email)
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (coursesError) {
      throw coursesError
    }

    const now = new Date()
    const classes: any[] = []

    courses?.forEach(course => {
      const enrolledStudents = course.course_enrollments?.map(enrollment => ({
        studentId: enrollment.students.student_id,
        userId: enrollment.students.users.id,
        name: enrollment.students.users.name,
        email: enrollment.students.users.email
      })) || []

      course.lectures.forEach(lecture => {
        const startTime = new Date(lecture.start_time)
        const endTime = new Date(lecture.end_time)
        
        // Determine lecture status
        let lectureStatus: string
        if (now < startTime) {
          lectureStatus = 'upcoming'
        } else if (now >= startTime && now <= endTime) {
          lectureStatus = 'active'
        } else {
          lectureStatus = 'completed'
        }

        // Filter by status if specified
        if (status && lectureStatus !== status) {
          return
        }

        // Filter by date if specified
        if (date) {
          const lectureDate = startTime.toISOString().split('T')[0]
          if (lectureDate !== date) {
            return
          }
        }

        // Calculate attendance statistics
        const attendanceRecords = lecture.attendance || []
        const totalStudents = enrolledStudents.length
        const presentCount = attendanceRecords.filter(a => a.status === 'present').length
        const lateCount = attendanceRecords.filter(a => a.status === 'late').length
        const absentCount = totalStudents - presentCount - lateCount

        classes.push({
          id: lecture.id,
          title: lecture.title,
          startTime: lecture.start_time,
          endTime: lecture.end_time,
          location: lecture.location,
          status: lectureStatus,
          hasQRCode: !!lecture.qr_code_data,
          course: {
            id: course.id,
            name: course.name,
            code: course.code,
            description: course.description
          },
          students: enrolledStudents,
          attendance: {
            total: totalStudents,
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            rate: totalStudents > 0 ? 
              ((presentCount + lateCount) / totalStudents * 100).toFixed(1) : 0
          }
        })
      })
    })

    // Sort classes by start time
    classes.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    // Calculate summary statistics
    const totalClasses = classes.length
    const activeClasses = classes.filter(c => c.status === 'active').length
    const upcomingClasses = classes.filter(c => c.status === 'upcoming').length
    const completedClasses = classes.filter(c => c.status === 'completed').length

    const response = {
      classes,
      summary: {
        total: totalClasses,
        active: activeClasses,
        upcoming: upcomingClasses,
        completed: completedClasses
      },
      filters: {
        status,
        date
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get teacher classes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher classes' },
      { status: 500 }
    )
  }
}
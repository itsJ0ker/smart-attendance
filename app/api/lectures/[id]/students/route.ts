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
    const lectureId = params.id

    // Get lecture details
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(`
        id,
        title,
        start_time,
        end_time,
        courses!inner(
          id,
          name,
          course_enrollments(
            students!inner(
              student_id,
              users!inner(id, name, email)
            )
          )
        )
      `)
      .eq('id', lectureId)
      .single()

    if (lectureError) {
      throw lectureError
    }

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      )
    }

    // Get attendance records for this lecture
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        student_id,
        status,
        marked_at,
        location,
        device_info
      `)
      .eq('lecture_id', lectureId)

    if (attendanceError) {
      throw attendanceError
    }

    // Create attendance map
    const attendanceMap = new Map()
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.student_id, record)
    })

    // Get enrolled students
    const enrolledStudents = lecture.courses.course_enrollments?.map(enrollment => {
      const student = enrollment.students
      const user = student.users
      const attendance = attendanceMap.get(student.student_id)

      return {
        studentId: student.student_id,
        userId: user.id,
        name: user.name,
        email: user.email,
        status: attendance?.status || 'absent',
        markedAt: attendance?.marked_at || null,
        location: attendance?.location || null,
        deviceInfo: attendance?.device_info || null
      }
    }) || []

    // Calculate statistics
    const totalStudents = enrolledStudents.length
    const presentStudents = enrolledStudents.filter(s => s.status === 'present').length
    const lateStudents = enrolledStudents.filter(s => s.status === 'late').length
    const absentStudents = enrolledStudents.filter(s => s.status === 'absent').length

    const response = {
      lecture: {
        id: lecture.id,
        title: lecture.title,
        startTime: lecture.start_time,
        endTime: lecture.end_time,
        courseName: lecture.courses.name
      },
      students: enrolledStudents,
      statistics: {
        total: totalStudents,
        present: presentStudents,
        late: lateStudents,
        absent: absentStudents,
        attendanceRate: totalStudents > 0 ? ((presentStudents + lateStudents) / totalStudents * 100).toFixed(1) : 0
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get lecture students error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lecture students' },
      { status: 500 }
    )
  }
}
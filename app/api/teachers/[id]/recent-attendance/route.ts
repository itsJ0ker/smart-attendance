// app/api/teachers/[id]/recent-attendance/route.ts
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
    const limit = parseInt(searchParams.get('limit') || '10')

    // Verify teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Get recent attendance for teacher's lectures
    const { data: recentAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        marked_at,
        student_id,
        lectures!inner (
          id,
          teacher_id,
          created_at,
          subjects!inner (
            id,
            name,
            code
          )
        )
      `)
      .eq('lectures.teacher_id', teacherId)
      .order('marked_at', { ascending: false })
      .limit(limit)

    if (attendanceError) {
      console.error('Error fetching recent attendance:', attendanceError)
      return NextResponse.json(
        { error: 'Failed to fetch recent attendance' },
        { status: 500 }
      )
    }

    // Get student information for the attendance records
    const studentIds = [...new Set((recentAttendance || []).map(record => record.student_id))]
    const { data: studentsData } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', studentIds)

    const studentsMap = new Map(studentsData?.map(student => [student.id, student]) || [])

    // Format the response
    const formattedAttendance = (recentAttendance || []).map(record => {
      const student = studentsMap.get(record.student_id)
      const lecture = record.lectures as any
      const subject = lecture?.subjects

      return {
        id: record.id,
        student_name: student?.name || 'Unknown Student',
        student_email: student?.email || '',
        student_avatar: student?.avatar_url || null,
        course_name: subject?.name || 'Unknown Subject',
        course_code: subject?.code || '',
        lecture_title: `${subject?.name || 'Lecture'}`,
        status: 'present', // All records in attendance table are present
        time: new Date(record.marked_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        date: new Date(record.marked_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedAttendance
    })

  } catch (error) {
    console.error('Error in teacher recent attendance API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
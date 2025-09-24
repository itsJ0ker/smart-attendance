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
    const courseId = params.id
    const { searchParams } = new URL(request.url)
    const includeAttendance = searchParams.get('include_attendance') === 'true'

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, code')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get lectures for the course
    let lectureQuery = supabase
      .from('lectures')
      .select(`
        id,
        title,
        start_time,
        end_time,
        location,
        qr_code_data,
        created_at
        ${includeAttendance ? `,
        attendance(
          id,
          status,
          marked_at,
          student_id
        )` : ''}
      `)
      .eq('course_id', courseId)
      .order('start_time', { ascending: false })

    const { data: lectures, error: lecturesError } = await lectureQuery

    if (lecturesError) {
      throw lecturesError
    }

    // Format lectures with statistics
    const formattedLectures = lectures?.map(lecture => {
      const now = new Date()
      const startTime = new Date(lecture.start_time)
      const endTime = new Date(lecture.end_time)

      let status: string
      if (now < startTime) {
        status = 'upcoming'
      } else if (now >= startTime && now <= endTime) {
        status = 'active'
      } else {
        status = 'completed'
      }

      const result: any = {
        id: lecture.id,
        title: lecture.title,
        startTime: lecture.start_time,
        endTime: lecture.end_time,
        location: lecture.location,
        status,
        hasQRCode: !!lecture.qr_code_data,
        createdAt: lecture.created_at
      }

      if (includeAttendance && lecture.attendance) {
        const attendanceRecords = lecture.attendance
        result.attendance = {
          total: attendanceRecords.length,
          present: attendanceRecords.filter(a => a.status === 'present').length,
          late: attendanceRecords.filter(a => a.status === 'late').length,
          absent: attendanceRecords.filter(a => a.status === 'absent').length
        }
      }

      return result
    }) || []

    return NextResponse.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code
      },
      lectures: formattedLectures,
      total: formattedLectures.length
    })
  } catch (error) {
    console.error('Get course lectures error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course lectures' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    const body = await request.json()
    const { title, startTime, endTime, location } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate time format
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      )
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, teacher_id')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check for scheduling conflicts
    const { data: conflictingLectures, error: conflictError } = await supabase
      .from('lectures')
      .select('id, title, start_time, end_time')
      .eq('course_id', courseId)
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`)

    if (conflictError) {
      throw conflictError
    }

    if (conflictingLectures && conflictingLectures.length > 0) {
      return NextResponse.json(
        { 
          error: 'Time slot conflicts with existing lecture',
          conflictingLecture: conflictingLectures[0]
        },
        { status: 409 }
      )
    }

    // Create lecture
    const { data: newLecture, error: insertError } = await supabase
      .from('lectures')
      .insert({
        course_id: courseId,
        title,
        start_time: startTime,
        end_time: endTime,
        location: location || null,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        title,
        start_time,
        end_time,
        location,
        created_at
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      lecture: {
        ...newLecture,
        status: 'upcoming',
        hasQRCode: false,
        course: {
          id: course.id,
          name: course.name
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create lecture error:', error)
    return NextResponse.json(
      { error: 'Failed to create lecture' },
      { status: 500 }
    )
  }
}
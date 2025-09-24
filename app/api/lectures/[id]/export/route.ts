// app/api/lectures/[id]/export/route.ts
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
        scheduled_at,
        duration_minutes,
        location,
        subjects (name, code),
        courses (name, code),
        users (name)
      `)
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { success: false, error: 'Lecture not found' },
        { status: 404 }
      )
    }

    // Get all students enrolled in the course with their attendance
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        students (
          id,
          student_id,
          year,
          users (
            id,
            name,
            email,
            phone
          )
        )
      `)
      .eq('course_id', lecture.course_id)

    if (enrollmentsError) {
      console.error('Enrollments error:', enrollmentsError)
      return NextResponse.json(
        { success: false, error: enrollmentsError.message },
        { status: 500 }
      )
    }

    // Get attendance records for this lecture
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, marked_at, location, device_info, ip_address')
      .eq('lecture_id', lectureId)

    if (attendanceError) {
      console.error('Attendance error:', attendanceError)
      return NextResponse.json(
        { success: false, error: attendanceError.message },
        { status: 500 }
      )
    }

    // Create attendance map
    const attendanceMap = new Map()
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.student_id, record)
    })

    // Prepare CSV headers
    const csvHeaders = [
      'Student ID',
      'Student Name',
      'Email',
      'Phone',
      'Year',
      'Attendance Status',
      'Marked At',
      'Location',
      'Device Info',
      'IP Address'
    ]

    // Prepare CSV rows
    const csvRows = enrollments?.map(enrollment => {
      const student = enrollment.students
      const user = student?.users
      const attendance = attendanceMap.get(student?.id)

      return [
        student?.student_id || '',
        user?.name || '',
        user?.email || '',
        user?.phone || '',
        student?.year || '',
        attendance?.status || 'absent',
        attendance?.marked_at ? new Date(attendance.marked_at).toLocaleString() : '',
        attendance?.location || '',
        attendance?.device_info || '',
        attendance?.ip_address || ''
      ]
    }) || []

    // Create CSV content
    const csvContent = [
      `# Attendance Report`,
      `# Lecture: ${lecture.title}`,
      `# Subject: ${lecture.subjects?.name} (${lecture.subjects?.code})`,
      `# Course: ${lecture.courses?.name} (${lecture.courses?.code})`,
      `# Teacher: ${lecture.users?.name}`,
      `# Date: ${new Date(lecture.scheduled_at).toLocaleString()}`,
      `# Duration: ${lecture.duration_minutes} minutes`,
      `# Location: ${lecture.location || 'Not specified'}`,
      `# Generated: ${new Date().toLocaleString()}`,
      ``,
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n')

    // Calculate statistics
    const totalStudents = csvRows.length
    const presentCount = csvRows.filter(row => row[5] === 'present').length
    const lateCount = csvRows.filter(row => row[5] === 'late').length
    const absentCount = csvRows.filter(row => row[5] === 'absent').length
    const attendanceRate = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents * 100).toFixed(1) : '0'

    // Add statistics to CSV
    const csvWithStats = [
      csvContent,
      ``,
      `# Statistics`,
      `# Total Students: ${totalStudents}`,
      `# Present: ${presentCount}`,
      `# Late: ${lateCount}`,
      `# Absent: ${absentCount}`,
      `# Attendance Rate: ${attendanceRate}%`
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvWithStats, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${lecture.title.replace(/\s+/g, '-').toLowerCase()}-${new Date(lecture.scheduled_at).toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export lecture attendance API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export attendance' },
      { status: 500 }
    )
  }
}
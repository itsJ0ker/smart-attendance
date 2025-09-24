// app/api/attendance/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const dateRange = searchParams.get('dateRange') || 'month'

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'semester':
        startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = new Date('2020-01-01') // Far back date
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select(`
        name,
        email,
        students (
          student_id,
          year,
          departments (name)
        )
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get attendance records
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        marked_at,
        location,
        device_info,
        ip_address,
        created_at,
        lectures (
          id,
          title,
          scheduled_at,
          duration_minutes,
          location,
          subjects (name, code),
          courses (name, code),
          users (name)
        )
      `)
      .eq('student_id', studentId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false })

    if (attendanceError) {
      console.error('Attendance records error:', attendanceError)
      return NextResponse.json(
        { success: false, error: attendanceError.message },
        { status: 500 }
      )
    }

    // Prepare CSV headers
    const csvHeaders = [
      'Date',
      'Time',
      'Lecture Title',
      'Subject',
      'Subject Code',
      'Course',
      'Teacher',
      'Scheduled Time',
      'Duration (min)',
      'Lecture Location',
      'Attendance Status',
      'Marked At',
      'Marked Location',
      'Device Info',
      'IP Address'
    ]

    // Prepare CSV rows
    const csvRows = attendanceRecords?.map(record => {
      const lecture = record.lectures
      const scheduledDate = new Date(lecture?.scheduled_at || '')
      const markedDate = record.marked_at ? new Date(record.marked_at) : null

      return [
        scheduledDate.toLocaleDateString(),
        scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lecture?.title || '',
        lecture?.subjects?.name || '',
        lecture?.subjects?.code || '',
        lecture?.courses?.name || '',
        lecture?.users?.name || '',
        scheduledDate.toLocaleString(),
        lecture?.duration_minutes || '',
        lecture?.location || '',
        record.status,
        markedDate ? markedDate.toLocaleString() : '',
        record.location || '',
        record.device_info || '',
        record.ip_address || ''
      ]
    }) || []

    // Calculate statistics
    const totalLectures = csvRows.length
    const presentCount = csvRows.filter(row => row[10] === 'present').length
    const lateCount = csvRows.filter(row => row[10] === 'late').length
    const absentCount = csvRows.filter(row => row[10] === 'absent').length
    const attendanceRate = totalLectures > 0 ? ((presentCount + lateCount) / totalLectures * 100).toFixed(1) : '0'
    const punctualityRate = totalLectures > 0 ? (presentCount / totalLectures * 100).toFixed(1) : '0'

    // Create CSV content
    const csvContent = [
      `# Student Attendance Report`,
      `# Student: ${student.name}`,
      `# Student ID: ${student.students?.[0]?.student_id || 'N/A'}`,
      `# Email: ${student.email}`,
      `# Department: ${student.students?.[0]?.departments?.name || 'N/A'}`,
      `# Year: ${student.students?.[0]?.year || 'N/A'}`,
      `# Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`,
      `# Generated: ${new Date().toLocaleString()}`,
      ``,
      `# Statistics`,
      `# Total Lectures: ${totalLectures}`,
      `# Present: ${presentCount}`,
      `# Late: ${lateCount}`,
      `# Absent: ${absentCount}`,
      `# Attendance Rate: ${attendanceRate}%`,
      `# Punctuality Rate: ${punctualityRate}%`,
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

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-${student.students?.[0]?.student_id || 'student'}-${dateRange}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export attendance API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export attendance' },
      { status: 500 }
    )
  }
}
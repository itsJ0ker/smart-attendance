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
    const studentId = params.id
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'semester':
        // Assume semester starts 4 months ago
        startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get attendance records with lecture and course details
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        marked_at,
        location,
        lectures!inner(
          id,
          title,
          start_time,
          end_time,
          courses!inner(
            id,
            name,
            code
          )
        )
      `)
      .eq('student_id', studentId)
      .gte('marked_at', startDate.toISOString())
      .order('marked_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (attendanceError) {
      throw attendanceError
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('attendance')
      .select('id', { count: 'exact' })
      .eq('student_id', studentId)
      .gte('marked_at', startDate.toISOString())

    if (countError) {
      throw countError
    }

    // Format attendance records
    const formattedRecords = attendanceRecords?.map(record => ({
      id: record.id,
      status: record.status,
      markedAt: record.marked_at,
      location: record.location,
      lecture: {
        id: record.lectures.id,
        title: record.lectures.title,
        startTime: record.lectures.start_time,
        endTime: record.lectures.end_time,
        course: {
          id: record.lectures.courses.id,
          name: record.lectures.courses.name,
          code: record.lectures.courses.code
        }
      }
    })) || []

    // Calculate statistics
    const totalRecords = formattedRecords.length
    const presentCount = formattedRecords.filter(r => r.status === 'present').length
    const lateCount = formattedRecords.filter(r => r.status === 'late').length
    const absentCount = formattedRecords.filter(r => r.status === 'absent').length

    const response = {
      attendance: formattedRecords,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      statistics: {
        total: totalRecords,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendanceRate: totalRecords > 0 ? 
          ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : 0
      },
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get student attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student attendance' },
      { status: 500 }
    )
  }
}
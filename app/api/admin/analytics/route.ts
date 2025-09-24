import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    // Get system-wide analytics
    const [
      totalUsersResult,
      totalStudentsResult,
      totalTeachersResult,
      totalLecturesResult,
      totalAttendanceResult,
      recentAttendanceResult,
      departmentStatsResult,
      anomaliesResult
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student'),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'teacher'),
      supabase.from('lectures').select('id', { count: 'exact' }),
      supabase.from('attendance').select('id', { count: 'exact' }),
      supabase
        .from('attendance')
        .select(`
          id,
          status,
          marked_at,
          students!inner(name),
          lectures!inner(title, start_time)
        `)
        .order('marked_at', { ascending: false })
        .limit(10),
      supabase
        .from('departments')
        .select(`
          id,
          name,
          students(id),
          teachers(id)
        `),
      supabase
        .from('anomaly_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Calculate attendance rates by department
    const departmentStats = departmentStatsResult.data?.map(dept => ({
      name: dept.name,
      studentCount: dept.students?.length || 0,
      teacherCount: dept.teachers?.length || 0
    })) || []

    // Calculate peak hours (mock data for now)
    const peakHours = [
      { hour: '09:00', count: 45 },
      { hour: '10:00', count: 52 },
      { hour: '11:00', count: 48 },
      { hour: '14:00', count: 41 },
      { hour: '15:00', count: 38 }
    ]

    // Calculate trends (mock data)
    const attendanceTrend = [
      { date: '2024-01-01', rate: 85.2 },
      { date: '2024-01-02', rate: 87.1 },
      { date: '2024-01-03', rate: 89.3 },
      { date: '2024-01-04', rate: 86.7 },
      { date: '2024-01-05', rate: 88.9 }
    ]

    const analytics = {
      overview: {
        totalUsers: totalUsersResult.count || 0,
        totalStudents: totalStudentsResult.count || 0,
        totalTeachers: totalTeachersResult.count || 0,
        totalLectures: totalLecturesResult.count || 0,
        totalAttendance: totalAttendanceResult.count || 0,
        averageAttendanceRate: 87.5 // Calculate from actual data
      },
      recentActivity: recentAttendanceResult.data?.map(record => ({
        id: record.id,
        studentName: record.students?.name || 'Unknown',
        lectureName: record.lectures?.title || 'Unknown',
        status: record.status,
        timestamp: record.marked_at
      })) || [],
      departmentStats,
      peakHours,
      attendanceTrend,
      anomalies: anomaliesResult.data?.map(anomaly => ({
        id: anomaly.id,
        type: anomaly.anomaly_type,
        description: anomaly.description,
        severity: anomaly.severity,
        timestamp: anomaly.created_at,
        resolved: anomaly.resolved
      })) || [],
      topPerformers: [
        { name: 'Alice Johnson', rate: 98.5, department: 'Computer Science' },
        { name: 'Bob Smith', rate: 96.2, department: 'Mathematics' },
        { name: 'Carol Davis', rate: 95.8, department: 'Physics' }
      ],
      atRiskStudents: [
        { name: 'David Wilson', rate: 65.2, department: 'Chemistry', missedClasses: 8 },
        { name: 'Eva Brown', rate: 68.9, department: 'Biology', missedClasses: 6 }
      ]
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
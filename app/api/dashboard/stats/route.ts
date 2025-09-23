// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { DashboardStats } from '../../../../types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'today'
    
    // Calculate date range based on timeRange
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'semester':
        startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        break
      default: // today
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Get total students
    const { data: studentsData, error: studentsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .eq('status', 'active')

    if (studentsError) throw studentsError

    // Get total teachers
    const { data: teachersData, error: teachersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'teacher')
      .eq('status', 'active')

    if (teachersError) throw teachersError

    // Get total subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('id')
      .eq('is_active', true)

    if (subjectsError) throw subjectsError

    // Get lectures for the time range
    const { data: lecturesData, error: lecturesError } = await supabase
      .from('lectures')
      .select('id, status, total_students, present_students')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())

    if (lecturesError) throw lecturesError

    // Get attendance data for the time range
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, status, marked_at')
      .gte('marked_at', startDate.toISOString())
      .lte('marked_at', now.toISOString())

    if (attendanceError) throw attendanceError

    // Get security alerts
    const { data: anomaliesData, error: anomaliesError } = await supabase
      .from('anomaly_logs')
      .select('id, severity')
      .eq('resolved', false)

    if (anomaliesError) throw anomaliesError

    // Calculate statistics
    const totalStudents = studentsData?.length || 0
    const totalTeachers = teachersData?.length || 0
    const totalSubjects = subjectsData?.length || 0
    const totalLecturesToday = lecturesData?.length || 0
    const activeLectures = lecturesData?.filter(l => l.status === 'active').length || 0
    
    // Calculate attendance percentage
    const totalAttendanceRecords = attendanceData?.length || 0
    const presentRecords = attendanceData?.filter(a => a.status === 'present').length || 0
    const averageAttendance = totalAttendanceRecords > 0 
      ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
      : 0

    // Calculate attendance trend (simplified)
    const yesterdayStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
    const { data: yesterdayAttendance } = await supabase
      .from('attendance')
      .select('id, status')
      .gte('marked_at', yesterdayStart.toISOString())
      .lt('marked_at', startDate.toISOString())

    const yesterdayPresent = yesterdayAttendance?.filter(a => a.status === 'present').length || 0
    const yesterdayTotal = yesterdayAttendance?.length || 0
    const yesterdayPercentage = yesterdayTotal > 0 ? (yesterdayPresent / yesterdayTotal) * 100 : 0
    
    let attendanceTrend: 'up' | 'down' | 'stable' = 'stable'
    if (averageAttendance > yesterdayPercentage + 2) {
      attendanceTrend = 'up'
    } else if (averageAttendance < yesterdayPercentage - 2) {
      attendanceTrend = 'down'
    }

    const securityAlerts = anomaliesData?.length || 0
    const systemHealth: 'good' | 'warning' | 'critical' = 
      securityAlerts > 10 ? 'critical' : 
      securityAlerts > 5 ? 'warning' : 'good'

    const stats: DashboardStats = {
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_subjects: totalSubjects,
      total_lectures_today: totalLecturesToday,
      active_lectures: activeLectures,
      average_attendance: averageAttendance,
      attendance_trend: attendanceTrend,
      security_alerts: securityAlerts,
      system_health: systemHealth
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics' 
      },
      { status: 500 }
    )
  }
}
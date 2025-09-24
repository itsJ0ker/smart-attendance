// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'today'

    // Get date range based on parameter
    const now = new Date()
    let startDate: Date
    let endDate = new Date(now)

    switch (range) {
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
        startDate = new Date(now.getFullYear(), now.getMonth() - 4, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Get total students
    const { data: studentsData, error: studentsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const totalStudents = studentsData?.length || 0

    // Get active teachers
    const { data: teachersData, error: teachersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'teacher')

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError)
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
    }

    const activeTeachers = teachersData?.length || 0

    // Get total subjects (instead of courses)
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('id')

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError)
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
    }

    const totalCourses = subjectsData?.length || 0

    // Get total lectures in range
    const { data: lecturesData, error: lecturesError } = await supabase
      .from('lectures')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (lecturesError) {
      console.error('Error fetching lectures:', lecturesError)
      return NextResponse.json({ error: 'Failed to fetch lectures' }, { status: 500 })
    }

    const totalLectures = lecturesData?.length || 0

    // Get attendance data for the range
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        marked_at,
        lectures!inner(created_at)
      `)
      .gte('lectures.created_at', startDate.toISOString())
      .lte('lectures.created_at', endDate.toISOString())

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError)
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }

    // Calculate attendance statistics (all attendance records are considered present)
    const presentCount = attendanceData?.length || 0
    const totalAttendanceRecords = attendanceData?.length || 0
    const attendanceRate = totalAttendanceRecords > 0 ? 100 : 0 // Since attendance table only stores present records

    // Get today's specific attendance for present/absent today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data: todayAttendance, error: todayError } = await supabase
      .from('attendance')
      .select(`
        id,
        marked_at,
        lectures!inner(created_at)
      `)
      .gte('lectures.created_at', todayStart.toISOString())
      .lte('lectures.created_at', todayEnd.toISOString())

    if (todayError) {
      console.error('Error fetching today attendance:', todayError)
    }

    const presentToday = todayAttendance?.length || 0
    // For absent today, we need to calculate based on total possible attendance
    const { data: todayLectures } = await supabase
      .from('lectures')
      .select('id')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())

    const totalPossibleToday = (todayLectures?.length || 0) * totalStudents
    const absentToday = Math.max(0, totalPossibleToday - presentToday)

    // Calculate attendance trend (simplified)
    const yesterdayStart = new Date()
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    yesterdayStart.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date()
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const { data: yesterdayAttendance } = await supabase
      .from('attendance')
      .select(`
        id,
        marked_at,
        lectures!inner(created_at)
      `)
      .gte('lectures.created_at', yesterdayStart.toISOString())
      .lte('lectures.created_at', yesterdayEnd.toISOString())

    const yesterdayPresent = yesterdayAttendance?.length || 0
    const { data: yesterdayLectures } = await supabase
      .from('lectures')
      .select('id')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString())

    const totalPossibleYesterday = (yesterdayLectures?.length || 0) * totalStudents
    const yesterdayRate = totalPossibleYesterday > 0 ? (yesterdayPresent / totalPossibleYesterday) * 100 : 0
    const todayRate = totalPossibleToday > 0 ? (presentToday / totalPossibleToday) * 100 : 0

    let attendanceTrend: 'up' | 'down' | 'neutral' = 'neutral'
    if (todayRate > yesterdayRate + 2) {
      attendanceTrend = 'up'
    } else if (todayRate < yesterdayRate - 2) {
      attendanceTrend = 'down'
    }

    const stats = {
      totalStudents,
      presentToday,
      absentToday,
      activeTeachers,
      totalCourses,
      totalLectures,
      attendanceRate,
      attendanceTrend
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error in admin stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
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

    // Get current date ranges
    const now = new Date()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all attendance records for the student with lecture and subject info
    const { data: allAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        marked_at,
        lecture_id,
        lectures!inner(
          id,
          subject_id,
          created_at,
          subjects!inner(
            id,
            name,
            code
          )
        )
      `)
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false })

    if (attendanceError) {
      throw attendanceError
    }

    // Get all lectures for subjects the student has attended (to calculate total possible)
    const attendedSubjectIds = [...new Set(allAttendance?.map(a => a.lectures.subject_id) || [])]
    
    let totalLectures = 0
    if (attendedSubjectIds.length > 0) {
      const { data: allSubjectLectures } = await supabase
        .from('lectures')
        .select('id')
        .in('subject_id', attendedSubjectIds)
      
      totalLectures = allSubjectLectures?.length || 0
    }

    // Calculate statistics (all attendance records are "present" since we only store present records)
    const totalAttended = allAttendance?.length || 0
    const presentCount = totalAttended // All records are present
    const lateCount = 0 // No late status in our schema
    const absentCount = Math.max(0, totalLectures - totalAttended) // Calculated as missing records

    // Weekly stats
    const weeklyAttendance = allAttendance?.filter(a => 
      new Date(a.marked_at) >= startOfWeek
    ) || []

    // Monthly stats
    const monthlyAttendance = allAttendance?.filter(a => 
      new Date(a.marked_at) >= startOfMonth
    ) || []

    // Subject-wise statistics
    const subjectStats = new Map()
    allAttendance?.forEach(record => {
      const subjectId = record.lectures.subjects.id
      const subjectName = record.lectures.subjects.name
      const subjectCode = record.lectures.subjects.code

      if (!subjectStats.has(subjectId)) {
        subjectStats.set(subjectId, {
          courseId: subjectId,
          courseName: subjectName,
          courseCode: subjectCode,
          total: 0,
          present: 0,
          late: 0,
          absent: 0
        })
      }

      const stats = subjectStats.get(subjectId)
      stats.present++ // All attendance records are present
    })

    // Get total lectures per subject to calculate absent count
    for (const [subjectId, stats] of subjectStats.entries()) {
      const { data: subjectLectures } = await supabase
        .from('lectures')
        .select('id')
        .eq('subject_id', subjectId)
      
      const totalSubjectLectures = subjectLectures?.length || 0
      stats.total = totalSubjectLectures
      stats.absent = Math.max(0, totalSubjectLectures - stats.present)
    }

    // Convert subject stats to array and calculate rates
    const courseStatsArray = Array.from(subjectStats.values()).map(stats => ({
      ...stats,
      attendanceRate: stats.total > 0 ? 
        (stats.present / stats.total * 100).toFixed(1) : 0
    }))

    // Recent attendance trend (last 30 days)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentAttendance = allAttendance?.filter(a => 
      new Date(a.marked_at) >= last30Days
    ) || []

    // Group by date for trend analysis
    const attendanceTrend = new Map()
    recentAttendance.forEach(record => {
      const date = new Date(record.marked_at).toISOString().split('T')[0]
      if (!attendanceTrend.has(date)) {
        attendanceTrend.set(date, { date, present: 0, late: 0, absent: 0 })
      }
      const dayStats = attendanceTrend.get(date)
      dayStats.present++ // All records are present
    })

    const trendData = Array.from(attendanceTrend.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate achievements
    const achievements = []
    
    // Perfect attendance streaks (consecutive days with attendance)
    let currentStreak = 0
    let maxStreak = 0
    
    // Group attendance by date to check for consecutive days
    const attendanceByDate = new Map()
    allAttendance?.forEach(record => {
      const date = new Date(record.marked_at).toISOString().split('T')[0]
      attendanceByDate.set(date, true)
    })

    // Sort dates and check for streaks
    const sortedDates = Array.from(attendanceByDate.keys()).sort()
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0 || new Date(sortedDates[i]).getTime() - new Date(sortedDates[i-1]).getTime() <= 24 * 60 * 60 * 1000) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    if (maxStreak >= 5) {
      achievements.push({
        id: 'perfect_streak',
        title: 'Perfect Attendance',
        description: `${maxStreak} consecutive days with attendance`,
        icon: '🏆',
        earnedAt: new Date().toISOString()
      })
    }

    // Regular attendee
    if (presentCount >= 20) {
      achievements.push({
        id: 'regular_attendee',
        title: 'Regular Attendee',
        description: `${presentCount} classes attended`,
        icon: '🌅',
        earnedAt: new Date().toISOString()
      })
    }

    const response = {
      overall: {
        totalLectures,
        totalAttended,
        attendanceRate: totalLectures > 0 ? 
          (presentCount / totalLectures * 100).toFixed(1) : 0,
        present: presentCount,
        late: lateCount,
        absent: absentCount
      },
      weekly: {
        total: weeklyAttendance.length,
        present: weeklyAttendance.length,
        late: 0,
        absent: 0
      },
      monthly: {
        total: monthlyAttendance.length,
        present: monthlyAttendance.length,
        late: 0,
        absent: 0
      },
      courseWise: courseStatsArray,
      trend: trendData,
      achievements,
      streaks: {
        current: currentStreak,
        longest: maxStreak
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get student stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student statistics' },
      { status: 500 }
    )
  }
}
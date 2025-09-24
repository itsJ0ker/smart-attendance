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

    // Get teacher's courses with lectures and attendance
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        created_at,
        lectures(
          id,
          title,
          start_time,
          end_time,
          attendance(
            id,
            status,
            marked_at,
            student_id
          )
        ),
        course_enrollments(
          id,
          student_id
        )
      `)
      .eq('teacher_id', teacherId)

    if (coursesError) {
      throw coursesError
    }

    const now = new Date()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Calculate overall statistics
    let totalLectures = 0
    let completedLectures = 0
    let totalStudents = 0
    let totalAttendanceRecords = 0
    let presentCount = 0
    let lateCount = 0
    let absentCount = 0

    // Weekly and monthly data
    const weeklyAttendance: any[] = []
    const monthlyAttendance: any[] = []

    // Course-wise statistics
    const courseStats: any[] = []

    // Attendance trend data (last 30 days)
    const attendanceTrend = new Map()

    courses?.forEach(course => {
      const courseEnrollments = course.course_enrollments?.length || 0
      totalStudents += courseEnrollments

      let courseLectures = 0
      let courseCompletedLectures = 0
      let courseAttendance = 0
      let coursePresent = 0
      let courseLate = 0
      let courseAbsent = 0

      course.lectures.forEach(lecture => {
        courseLectures++
        totalLectures++

        const lectureEnd = new Date(lecture.end_time)
        if (now > lectureEnd) {
          courseCompletedLectures++
          completedLectures++
        }

        const attendanceRecords = lecture.attendance || []
        courseAttendance += attendanceRecords.length
        totalAttendanceRecords += attendanceRecords.length

        attendanceRecords.forEach(record => {
          const recordDate = new Date(record.marked_at)
          
          // Count by status
          if (record.status === 'present') {
            coursePresent++
            presentCount++
          } else if (record.status === 'late') {
            courseLate++
            lateCount++
          } else if (record.status === 'absent') {
            courseAbsent++
            absentCount++
          }

          // Weekly data
          if (recordDate >= startOfWeek) {
            weeklyAttendance.push(record)
          }

          // Monthly data
          if (recordDate >= startOfMonth) {
            monthlyAttendance.push(record)
          }

          // Trend data (last 30 days)
          const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (recordDate >= last30Days) {
            const dateKey = recordDate.toISOString().split('T')[0]
            if (!attendanceTrend.has(dateKey)) {
              attendanceTrend.set(dateKey, {
                date: dateKey,
                present: 0,
                late: 0,
                absent: 0,
                total: 0
              })
            }
            const dayData = attendanceTrend.get(dateKey)
            dayData[record.status]++
            dayData.total++
          }
        })
      })

      // Calculate course statistics
      const expectedAttendance = courseCompletedLectures * courseEnrollments
      courseStats.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        totalLectures: courseLectures,
        completedLectures: courseCompletedLectures,
        enrolledStudents: courseEnrollments,
        totalAttendance: courseAttendance,
        expectedAttendance,
        attendanceRate: expectedAttendance > 0 ? 
          ((coursePresent + courseLate) / expectedAttendance * 100).toFixed(1) : 0,
        present: coursePresent,
        late: courseLate,
        absent: courseAbsent
      })
    })

    // Convert trend data to array and sort by date
    const trendData = Array.from(attendanceTrend.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate weekly statistics
    const weeklyStats = {
      total: weeklyAttendance.length,
      present: weeklyAttendance.filter(a => a.status === 'present').length,
      late: weeklyAttendance.filter(a => a.status === 'late').length,
      absent: weeklyAttendance.filter(a => a.status === 'absent').length
    }

    // Calculate monthly statistics
    const monthlyStats = {
      total: monthlyAttendance.length,
      present: monthlyAttendance.filter(a => a.status === 'present').length,
      late: monthlyAttendance.filter(a => a.status === 'late').length,
      absent: monthlyAttendance.filter(a => a.status === 'absent').length
    }

    // Find top performing and at-risk students
    const studentPerformance = new Map()
    
    courses?.forEach(course => {
      course.lectures.forEach(lecture => {
        lecture.attendance?.forEach(record => {
          if (!studentPerformance.has(record.student_id)) {
            studentPerformance.set(record.student_id, {
              studentId: record.student_id,
              total: 0,
              present: 0,
              late: 0,
              absent: 0
            })
          }
          const perf = studentPerformance.get(record.student_id)
          perf.total++
          perf[record.status]++
        })
      })
    })

    const studentStats = Array.from(studentPerformance.values())
      .map(stats => ({
        ...stats,
        attendanceRate: stats.total > 0 ? 
          ((stats.present + stats.late) / stats.total * 100) : 0
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)

    const topPerformers = studentStats.slice(0, 5)
    const atRiskStudents = studentStats.filter(s => s.attendanceRate < 75).slice(0, 5)

    const response = {
      overview: {
        totalCourses: courses?.length || 0,
        totalLectures,
        completedLectures,
        totalStudents,
        overallAttendanceRate: totalAttendanceRecords > 0 ? 
          ((presentCount + lateCount) / totalAttendanceRecords * 100).toFixed(1) : 0
      },
      attendance: {
        total: totalAttendanceRecords,
        present: presentCount,
        late: lateCount,
        absent: absentCount
      },
      weekly: weeklyStats,
      monthly: monthlyStats,
      courseWise: courseStats,
      trend: trendData,
      topPerformers,
      atRiskStudents: atRiskStudents.map(student => ({
        ...student,
        attendanceRate: student.attendanceRate.toFixed(1)
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get teacher stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teacher statistics' },
      { status: 500 }
    )
  }
}
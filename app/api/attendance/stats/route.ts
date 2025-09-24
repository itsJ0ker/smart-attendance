// app/api/attendance/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import attendanceService from '../../../../lib/services/attendanceService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const timeRange = searchParams.get('timeRange') as 'week' | 'month' | 'semester' || 'month'

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing studentId' },
        { status: 400 }
      )
    }

    const stats = await attendanceService.getStudentAttendanceStats(studentId, timeRange)

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error getting attendance stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
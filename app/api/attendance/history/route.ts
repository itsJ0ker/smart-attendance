// app/api/attendance/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import attendanceService from '../../../../lib/services/attendanceService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Missing studentId' },
        { status: 400 }
      )
    }

    const history = await attendanceService.getStudentAttendanceHistory(studentId, limit)

    return NextResponse.json({
      success: true,
      data: history
    })

  } catch (error) {
    console.error('Error getting attendance history:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
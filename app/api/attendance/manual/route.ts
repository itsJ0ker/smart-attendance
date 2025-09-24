// app/api/attendance/manual/route.ts
import { NextRequest, NextResponse } from 'next/server'
import attendanceService from '../../../../lib/services/attendanceService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lectureId, studentId, status, notes } = body

    // Validate required fields
    if (!lectureId || !studentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const result = await attendanceService.markManualAttendance(
      lectureId,
      studentId,
      status,
      notes
    )

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: result.data
    })

  } catch (error) {
    console.error('Error in manual attendance API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
// app/api/lectures/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server'
import lectureService from '../../../../lib/services/lectureService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const date = searchParams.get('date') // Optional: specific date, defaults to today

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or role' },
        { status: 400 }
      )
    }

    let schedule = []

    if (role === 'teacher') {
      schedule = await lectureService.getTeacherTodaySchedule(userId)
    } else if (role === 'student') {
      schedule = await lectureService.getStudentTodaySchedule(userId)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: schedule
    })

  } catch (error) {
    console.error('Error getting schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
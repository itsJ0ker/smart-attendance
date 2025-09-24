// app/api/lectures/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import lectureService from '../../../../lib/services/lectureService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      course_id,
      teacher_id,
      title,
      description,
      scheduled_at,
      duration_minutes = 90,
      room
    } = body

    // Validate required fields
    if (!course_id || !teacher_id || !title || !scheduled_at) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate duration
    if (duration_minutes < 30 || duration_minutes > 300) {
      return NextResponse.json(
        { success: false, error: 'Duration must be between 30 and 300 minutes' },
        { status: 400 }
      )
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Lecture must be scheduled for a future time' },
        { status: 400 }
      )
    }

    const result = await lectureService.createLecture({
      course_id,
      teacher_id,
      title,
      description,
      scheduled_at,
      duration_minutes,
      room
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lecture created successfully',
      data: result.data
    })

  } catch (error) {
    console.error('Error creating lecture:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
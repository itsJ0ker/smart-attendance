// app/api/lectures/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import lectureService from '../../../../../lib/services/lectureService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = params.id

    if (!lectureId) {
      return NextResponse.json(
        { success: false, error: 'Missing lecture ID' },
        { status: 400 }
      )
    }

    const lecture = await lectureService.getLectureDetails(lectureId)

    if (!lecture) {
      return NextResponse.json(
        { success: false, error: 'Lecture not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lecture
    })

  } catch (error) {
    console.error('Error getting lecture details:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = params.id
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!lectureId || !teacherId) {
      return NextResponse.json(
        { success: false, error: 'Missing lecture ID or teacher ID' },
        { status: 400 }
      )
    }

    const result = await lectureService.deactivateQRCode(lectureId, teacherId)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'QR code deactivated successfully'
    })

  } catch (error) {
    console.error('Error deactivating QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
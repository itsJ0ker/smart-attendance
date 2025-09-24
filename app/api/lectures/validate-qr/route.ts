// app/api/lectures/validate-qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import lectureService from '../../../../lib/services/lectureService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lectureId, qrCode } = body

    // Validate required fields
    if (!lectureId || !qrCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await lectureService.validateQRCode(lectureId, qrCode)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'QR code is valid',
      data: {
        lecture_id: result.data.id,
        title: result.data.title,
        scheduled_at: result.data.scheduled_at,
        expires_at: result.data.qr_expires_at
      }
    })

  } catch (error) {
    console.error('Error validating QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
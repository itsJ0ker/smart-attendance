// app/api/lectures/generate-qr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import lectureService from '../../../../lib/services/lectureService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lectureId, teacherId, expirationMinutes = 30 } = body

    // Validate required fields
    if (!lectureId || !teacherId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate expiration minutes
    if (expirationMinutes < 5 || expirationMinutes > 180) {
      return NextResponse.json(
        { success: false, error: 'Expiration time must be between 5 and 180 minutes' },
        { status: 400 }
      )
    }

    const result = await lectureService.generateQRCode(lectureId, teacherId, expirationMinutes)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'QR code generated successfully',
      data: result.data
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
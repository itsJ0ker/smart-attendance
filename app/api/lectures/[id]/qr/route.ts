import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = params.id

    // Get lecture details
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(`
        id,
        title,
        start_time,
        end_time,
        qr_code_data,
        courses!inner(name)
      `)
      .eq('id', lectureId)
      .single()

    if (lectureError) {
      throw lectureError
    }

    if (!lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      )
    }

    // Generate QR code data if not exists
    let qrCodeData = lecture.qr_code_data
    if (!qrCodeData) {
      qrCodeData = JSON.stringify({
        lectureId: lecture.id,
        timestamp: new Date().toISOString(),
        title: lecture.title,
        course: lecture.courses.name
      })

      // Update lecture with QR code data
      await supabase
        .from('lectures')
        .update({ qr_code_data: qrCodeData })
        .eq('id', lectureId)
    }

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    const response = {
      lectureId: lecture.id,
      title: lecture.title,
      courseName: lecture.courses.name,
      startTime: lecture.start_time,
      endTime: lecture.end_time,
      qrCodeData,
      qrCodeImage,
      isActive: new Date() >= new Date(lecture.start_time) && new Date() <= new Date(lecture.end_time)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Generate QR code error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = params.id

    // Regenerate QR code with new timestamp
    const qrCodeData = JSON.stringify({
      lectureId,
      timestamp: new Date().toISOString(),
      regenerated: true
    })

    // Update lecture with new QR code data
    const { error: updateError } = await supabase
      .from('lectures')
      .update({ qr_code_data: qrCodeData })
      .eq('id', lectureId)

    if (updateError) {
      throw updateError
    }

    // Generate new QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      qrCodeData,
      qrCodeImage,
      regeneratedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Regenerate QR code error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate QR code' },
      { status: 500 }
    )
  }
}
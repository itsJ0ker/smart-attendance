import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCodeData, studentId, location, deviceInfo } = body

    if (!qrCodeData || !studentId) {
      return NextResponse.json(
        { error: 'QR code data and student ID are required' },
        { status: 400 }
      )
    }

    // Parse QR code data
    let lectureData
    try {
      lectureData = JSON.parse(qrCodeData)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      )
    }

    const lectureId = lectureData.lectureId

    // Verify lecture exists and is active
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('id, title, start_time, end_time, courses!inner(name)')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: 'Lecture not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const startTime = new Date(lecture.start_time)
    const endTime = new Date(lecture.end_time)

    // Check if lecture is currently active (with 15 minute buffer)
    const bufferTime = 15 * 60 * 1000 // 15 minutes in milliseconds
    const isActive = now >= new Date(startTime.getTime() - bufferTime) && 
                     now <= new Date(endTime.getTime() + bufferTime)

    if (!isActive) {
      return NextResponse.json(
        { error: 'Lecture is not currently active for attendance' },
        { status: 400 }
      )
    }

    // Verify student is enrolled in the course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', lecture.courses.id)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if attendance already marked
    const { data: existingAttendance, error: existingError } = await supabase
      .from('attendance')
      .select('id, status')
      .eq('lecture_id', lectureId)
      .eq('student_id', studentId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError
    }

    // Determine attendance status based on timing
    let status = 'present'
    const lateThreshold = 10 * 60 * 1000 // 10 minutes after start time
    if (now > new Date(startTime.getTime() + lateThreshold)) {
      status = 'late'
    }

    const attendanceData = {
      lecture_id: lectureId,
      student_id: studentId,
      status,
      marked_at: now.toISOString(),
      location: location || null,
      device_info: deviceInfo || null
    }

    let result
    if (existingAttendance) {
      // Update existing attendance
      const { data, error } = await supabase
        .from('attendance')
        .update(attendanceData)
        .eq('id', existingAttendance.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new attendance record
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      attendance: result,
      lecture: {
        id: lecture.id,
        title: lecture.title,
        courseName: lecture.courses.name,
        startTime: lecture.start_time,
        endTime: lecture.end_time
      },
      message: existingAttendance 
        ? `Attendance updated to ${status}` 
        : `Attendance marked as ${status}`
    })

  } catch (error) {
    console.error('Mark attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}
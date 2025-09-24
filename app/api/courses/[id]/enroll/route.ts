import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    const body = await request.json()
    const { studentIds } = body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Student IDs array is required' },
        { status: 400 }
      )
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, code')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Verify all students exist
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', studentIds)
      .eq('role', 'student')

    if (studentsError) {
      throw studentsError
    }

    if (!students || students.length !== studentIds.length) {
      const foundIds = students?.map(s => s.id) || []
      const missingIds = studentIds.filter(id => !foundIds.includes(id))
      return NextResponse.json(
        { 
          error: 'Some students not found',
          missingStudentIds: missingIds
        },
        { status: 404 }
      )
    }

    // Check for existing enrollments
    const { data: existingEnrollments, error: existingError } = await supabase
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', courseId)
      .in('student_id', studentIds)

    if (existingError) {
      throw existingError
    }

    const alreadyEnrolledIds = existingEnrollments?.map(e => e.student_id) || []
    const newEnrollmentIds = studentIds.filter(id => !alreadyEnrolledIds.includes(id))

    if (newEnrollmentIds.length === 0) {
      return NextResponse.json(
        { 
          message: 'All students are already enrolled in this course',
          alreadyEnrolled: alreadyEnrolledIds.length,
          newEnrollments: 0
        }
      )
    }

    // Create new enrollments
    const enrollmentData = newEnrollmentIds.map(studentId => ({
      course_id: courseId,
      student_id: studentId,
      enrolled_at: new Date().toISOString()
    }))

    const { data: newEnrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .insert(enrollmentData)
      .select(`
        id,
        student_id,
        enrolled_at,
        students!inner(
          student_id,
          users!inner(id, name, email)
        )
      `)

    if (enrollError) {
      throw enrollError
    }

    // Format response
    const enrolledStudents = newEnrollments?.map(enrollment => ({
      enrollmentId: enrollment.id,
      studentId: enrollment.students.student_id,
      userId: enrollment.students.users.id,
      name: enrollment.students.users.name,
      email: enrollment.students.users.email,
      enrolledAt: enrollment.enrolled_at
    })) || []

    return NextResponse.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code
      },
      enrolledStudents,
      summary: {
        totalRequested: studentIds.length,
        alreadyEnrolled: alreadyEnrolledIds.length,
        newEnrollments: newEnrollmentIds.length
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Enroll students error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll students' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    const body = await request.json()
    const { studentIds } = body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Student IDs array is required' },
        { status: 400 }
      )
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, code')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Remove enrollments
    const { data: removedEnrollments, error: removeError } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId)
      .in('student_id', studentIds)
      .select('student_id')

    if (removeError) {
      throw removeError
    }

    const removedCount = removedEnrollments?.length || 0

    return NextResponse.json({
      course: {
        id: course.id,
        name: course.name,
        code: course.code
      },
      removedStudents: removedEnrollments?.map(e => e.student_id) || [],
      summary: {
        totalRequested: studentIds.length,
        actuallyRemoved: removedCount
      }
    })

  } catch (error) {
    console.error('Unenroll students error:', error)
    return NextResponse.json(
      { error: 'Failed to unenroll students' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id

    // Get enrolled students
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        student_id,
        enrolled_at,
        students!inner(
          student_id,
          users!inner(id, name, email)
        )
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false })

    if (enrollmentsError) {
      throw enrollmentsError
    }

    // Format enrolled students
    const enrolledStudents = enrollments?.map(enrollment => ({
      enrollmentId: enrollment.id,
      studentId: enrollment.students.student_id,
      userId: enrollment.students.users.id,
      name: enrollment.students.users.name,
      email: enrollment.students.users.email,
      enrolledAt: enrollment.enrolled_at
    })) || []

    return NextResponse.json({
      enrolledStudents,
      total: enrolledStudents.length
    })

  } catch (error) {
    console.error('Get course enrollments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course enrollments' },
      { status: 500 }
    )
  }
}
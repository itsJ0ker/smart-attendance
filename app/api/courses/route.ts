import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const includeStats = searchParams.get('include_stats') === 'true'

    let query = supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        description,
        teacher_id,
        created_at,
        updated_at,
        users!courses_teacher_id_fkey(
          id,
          name,
          email
        )
        ${includeStats ? `,
        lectures(
          id,
          title,
          start_time,
          end_time
        ),
        course_enrollments(
          id,
          student_id
        )` : ''}
      `)

    if (teacherId) {
      query = query.eq('teacher_id', teacherId)
    }

    const { data: courses, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Add statistics if requested
    const coursesWithStats = courses?.map(course => {
      const result: any = {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        teacherId: course.teacher_id,
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        teacher: course.users ? {
          id: course.users.id,
          name: course.users.name,
          email: course.users.email
        } : null
      }

      if (includeStats) {
        result.statistics = {
          totalLectures: course.lectures?.length || 0,
          enrolledStudents: course.course_enrollments?.length || 0,
          upcomingLectures: course.lectures?.filter(lecture => 
            new Date(lecture.start_time) > new Date()
          ).length || 0
        }
      }

      return result
    }) || []

    return NextResponse.json({
      courses: coursesWithStats,
      total: coursesWithStats.length
    })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, description, teacherId } = body

    if (!name || !code || !teacherId) {
      return NextResponse.json(
        { error: 'Name, code, and teacher ID are required' },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const { data: existingCourse, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 409 }
      )
    }

    // Verify teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Create course
    const { data: newCourse, error: insertError } = await supabase
      .from('courses')
      .insert({
        name,
        code,
        description: description || null,
        teacher_id: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        name,
        code,
        description,
        teacher_id,
        created_at,
        updated_at
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      course: {
        ...newCourse,
        teacher: {
          id: teacher.id,
          name: teacher.name
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
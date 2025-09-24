// app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const offset = (page - 1) * limit

    // Get total count
    const { count, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting courses:', countError)
      return NextResponse.json({ error: 'Failed to count courses' }, { status: 500 })
    }

    // Get paginated courses with teacher information
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        description,
        created_at,
        teacher_id,
        users!courses_teacher_id_fkey(name)
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    // Enhance course data with statistics
    const enhancedCourses = await Promise.all(
      (courses || []).map(async (course) => {
        // Get enrollment count
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', course.id)

        const enrolledCount = enrollments?.length || 0

        // Get total lectures
        const { data: lectures } = await supabase
          .from('lectures')
          .select('id')
          .eq('course_id', course.id)

        const totalLectures = lectures?.length || 0

        // Get attendance data for average calculation
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`
            status,
            lectures!inner(course_id)
          `)
          .eq('lectures.course_id', course.id)

        const totalAttendance = attendanceData?.length || 0
        const presentCount = attendanceData?.filter(a => a.status === 'present' || a.status === 'late').length || 0
        const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

        return {
          id: course.id,
          name: course.name,
          code: course.code,
          teacher_name: course.users?.name || 'Unassigned',
          teacher_id: course.teacher_id,
          enrolled_count: enrolledCount,
          total_lectures: totalLectures,
          average_attendance: averageAttendance,
          created_at: course.created_at,
          status: 'active' // Default status
        }
      })
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      courses: enhancedCourses,
      total: count || 0,
      page,
      totalPages
    })

  } catch (error) {
    console.error('Error in admin courses GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, teacher_id, description } = body

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name and code' },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .single()

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 409 }
      )
    }

    // Validate teacher if provided
    if (teacher_id) {
      const { data: teacher } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', teacher_id)
        .eq('role', 'teacher')
        .single()

      if (!teacher) {
        return NextResponse.json(
          { error: 'Invalid teacher ID' },
          { status: 400 }
        )
      }
    }

    // Create course
    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert({
        name,
        code,
        teacher_id: teacher_id || null,
        description: description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating course:', createError)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: newCourse.id }, { status: 201 })

  } catch (error) {
    console.error('Error in admin courses POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
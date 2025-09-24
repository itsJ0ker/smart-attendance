// app/api/admin/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent attendance activities
    const { data: attendanceActivities, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        id,
        status,
        marked_at,
        students:users!attendance_student_id_fkey(
          id,
          name,
          role
        ),
        lectures!inner(
          id,
          title,
          courses!inner(
            id,
            name,
            code
          )
        )
      `)
      .order('marked_at', { ascending: false })
      .limit(Math.floor(limit * 0.6)) // 60% of activities from attendance

    if (attendanceError) {
      console.error('Error fetching attendance activities:', attendanceError)
    }

    // Get recent user creation activities
    const { data: userActivities, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        role,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(Math.floor(limit * 0.2)) // 20% from user creation

    if (userError) {
      console.error('Error fetching user activities:', userError)
    }

    // Get recent course creation activities
    const { data: courseActivities, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        name,
        code,
        created_at,
        users!courses_teacher_id_fkey(
          name,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(Math.floor(limit * 0.2)) // 20% from course creation

    if (courseError) {
      console.error('Error fetching course activities:', courseError)
    }

    // Format activities
    const activities = []

    // Add attendance activities
    if (attendanceActivities) {
      attendanceActivities.forEach(record => {
        activities.push({
          id: `attendance_${record.id}`,
          type: 'attendance',
          user_name: record.students?.name || 'Unknown Student',
          user_role: record.students?.role || 'student',
          description: `Marked ${record.status} for ${record.lectures?.courses?.name} (${record.lectures?.courses?.code})`,
          timestamp: record.marked_at,
          metadata: {
            course: record.lectures?.courses?.name,
            status: record.status
          }
        })
      })
    }

    // Add user creation activities
    if (userActivities) {
      userActivities.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'user_created',
          user_name: user.name,
          user_role: user.role,
          description: `New ${user.role} account created`,
          timestamp: user.created_at,
          metadata: {
            role: user.role
          }
        })
      })
    }

    // Add course creation activities
    if (courseActivities) {
      courseActivities.forEach(course => {
        activities.push({
          id: `course_${course.id}`,
          type: 'course_created',
          user_name: course.users?.name || 'System',
          user_role: course.users?.role || 'admin',
          description: `New course created: ${course.name} (${course.code})`,
          timestamp: course.created_at,
          metadata: {
            course_name: course.name,
            course_code: course.code
          }
        })
      })
    }

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      activities: sortedActivities
    })

  } catch (error) {
    console.error('Error in admin activity API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
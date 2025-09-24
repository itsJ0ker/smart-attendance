// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        created_at,
        updated_at,
        avatar_url
      `)

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting users:', countError)
      return NextResponse.json({ error: 'Failed to count users' }, { status: 500 })
    }

    // Get paginated users
    const { data: users, error: usersError } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Enhance user data with additional stats
    const enhancedUsers = await Promise.all(
      (users || []).map(async (user) => {
        let additionalData = {}

        if (user.role === 'student') {
          // Get attendance rate for students
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', user.id)

          const totalAttendance = attendanceData?.length || 0
          const presentCount = attendanceData?.filter(a => a.status === 'present' || a.status === 'late').length || 0
          const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

          additionalData = { attendance_rate: attendanceRate }
        } else if (user.role === 'teacher') {
          // Get subjects count for teachers (through lectures)
          const { data: lecturesData } = await supabase
            .from('lectures')
            .select('subject_id')
            .eq('teacher_id', user.id)

          const uniqueSubjects = new Set(lecturesData?.map(l => l.subject_id) || [])
          additionalData = { courses_count: uniqueSubjects.size }
        }

        return {
          ...user,
          status: 'active', // Default status, can be enhanced later
          ...additionalData
        }
      })
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users: enhancedUsers,
      total: count || 0,
      page,
      totalPages
    })

  } catch (error) {
    console.error('Error in admin users GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: newUser.id }, { status: 201 })

  } catch (error) {
    console.error('Error in admin users POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
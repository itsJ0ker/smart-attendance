// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import userService from '../../../lib/services/userService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role') as 'admin' | 'teacher' | 'student' | undefined
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') as 'active' | 'inactive' | 'suspended' | undefined

    const result = await userService.getUsers(page, limit, role, search, status)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      role,
      phone,
      avatar_url,
      student_id,
      department_id,
      year,
      semester,
      employee_id,
      specialization
    } = body

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role-specific fields
    if (role === 'student' && (!student_id || !department_id)) {
      return NextResponse.json(
        { success: false, error: 'Student ID and department are required for students' },
        { status: 400 }
      )
    }

    if (role === 'teacher' && (!employee_id || !department_id)) {
      return NextResponse.json(
        { success: false, error: 'Employee ID and department are required for teachers' },
        { status: 400 }
      )
    }

    const result = await userService.createUser({
      email,
      password,
      name,
      role,
      phone,
      avatar_url,
      student_id,
      department_id,
      year,
      semester,
      employee_id,
      specialization
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: result.data
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
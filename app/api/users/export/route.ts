import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        status,
        created_at,
        updated_at,
        students(student_id, department_id, departments(name)),
        teachers(teacher_id, department_id, departments(name))
      `)

    if (role) {
      query = query.eq('role', role)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: users, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Name',
        'Email',
        'Role',
        'Status',
        'Department',
        'Created At',
        'Updated At'
      ]

      const csvRows = [
        headers.join(','),
        ...users.map(user => {
          const department = user.role === 'student' 
            ? user.students?.[0]?.departments?.name || 'N/A'
            : user.role === 'teacher'
            ? user.teachers?.[0]?.departments?.name || 'N/A'
            : 'N/A'

          return [
            user.id,
            `"${user.name}"`,
            user.email,
            user.role,
            user.status,
            `"${department}"`,
            new Date(user.created_at).toISOString().split('T')[0],
            new Date(user.updated_at).toISOString().split('T')[0]
          ].join(',')
        })
      ]

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Return JSON format
    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.role === 'student' 
          ? user.students?.[0]?.departments?.name || 'N/A'
          : user.role === 'teacher'
          ? user.teachers?.[0]?.departments?.name || 'N/A'
          : 'N/A',
        createdAt: user.created_at,
        updatedAt: user.updated_at
      })),
      exportedAt: new Date().toISOString(),
      totalRecords: users.length
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    )
  }
}
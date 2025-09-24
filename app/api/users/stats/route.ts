import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user statistics
    const [
      totalUsersResult,
      activeUsersResult,
      studentsResult,
      teachersResult,
      adminsResult,
      recentUsersResult
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student'),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'teacher'),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'admin'),
      supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Calculate growth rate (mock calculation)
    const currentMonth = new Date().getMonth()
    const lastMonth = currentMonth - 1
    const growthRate = 12.5 // Mock growth rate

    const stats = {
      totalUsers: totalUsersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      students: studentsResult.count || 0,
      teachers: teachersResult.count || 0,
      admins: adminsResult.count || 0,
      growthRate,
      recentUsers: recentUsersResult.data || [],
      usersByRole: [
        { role: 'Students', count: studentsResult.count || 0, color: '#3B82F6' },
        { role: 'Teachers', count: teachersResult.count || 0, color: '#10B981' },
        { role: 'Admins', count: adminsResult.count || 0, color: '#F59E0B' }
      ],
      monthlyGrowth: [
        { month: 'Jan', users: 120 },
        { month: 'Feb', users: 135 },
        { month: 'Mar', users: 148 },
        { month: 'Apr', users: 162 },
        { month: 'May', users: 178 },
        { month: 'Jun', users: 195 }
      ]
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
}
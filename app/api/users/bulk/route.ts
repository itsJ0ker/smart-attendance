import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { action, userIds } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Action and userIds array are required' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'activate':
        result = await supabase
          .from('users')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .in('id', userIds)
        break

      case 'deactivate':
        result = await supabase
          .from('users')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .in('id', userIds)
        break

      case 'delete':
        // Soft delete by updating status
        result = await supabase
          .from('users')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .in('id', userIds)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: activate, deactivate, or delete' },
          { status: 400 }
        )
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      message: `Successfully ${action}d ${userIds.length} users`,
      affectedUsers: userIds.length
    })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
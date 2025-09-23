// app/api/dashboard/recent-activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Get recent attendance records with student and lecture details
    const { data: recentActivity, error } = await supabase
      .from('attendance')
      .select(`
        id,
        marked_at,
        status,
        student:students!inner(
          id,
          student_id,
          users!inner(
            name,
            avatar_url
          )
        ),
        lecture:lectures!inner(
          id,
          title,
          subject:subjects!inner(
            name,
            code
          )
        )
      `)
      .eq('status', 'present')
      .order('marked_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Transform the data to match the expected format
    const formattedActivity = recentActivity?.map(record => ({
      id: record.id,
      student: record.student?.users?.name || 'Unknown Student',
      student_id: record.student?.student_id || '',
      course: `${record.lecture?.subject?.code} - ${record.lecture?.subject?.name}` || 'Unknown Course',
      lecture_title: record.lecture?.title || '',
      time: new Date(record.marked_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      status: record.status,
      avatar_url: record.student?.users?.avatar_url,
      marked_at: record.marked_at
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedActivity
    })

  } catch (error) {
    console.error('Recent activity error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch recent activity' 
      },
      { status: 500 }
    )
  }
}
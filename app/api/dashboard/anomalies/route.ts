// app/api/dashboard/anomalies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const resolved = searchParams.get('resolved') === 'true'
    
    // Get recent anomaly logs with user details
    const { data: anomalies, error } = await supabase
      .from('anomaly_logs')
      .select(`
        id,
        type,
        description,
        severity,
        resolved,
        created_at,
        metadata,
        user:users!inner(
          name,
          avatar_url,
          role
        )
      `)
      .eq('resolved', resolved)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Transform the data to match the expected format
    const formattedAnomalies = anomalies?.map(anomaly => ({
      id: anomaly.id,
      type: anomaly.type,
      student: anomaly.user?.name || 'Unknown User',
      user_role: anomaly.user?.role || 'unknown',
      message: anomaly.description,
      severity: anomaly.severity,
      time: new Date(anomaly.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      date: new Date(anomaly.created_at).toLocaleDateString('en-US'),
      resolved: anomaly.resolved,
      metadata: anomaly.metadata,
      avatar_url: anomaly.user?.avatar_url,
      created_at: anomaly.created_at
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedAnomalies
    })

  } catch (error) {
    console.error('Anomalies fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch security anomalies' 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { anomalyId, resolved, resolution_notes } = await request.json()
    
    if (!anomalyId) {
      return NextResponse.json(
        { success: false, error: 'Anomaly ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('anomaly_logs')
      .update({
        resolved: resolved,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolution_notes: resolution_notes || null
      })
      .eq('id', anomalyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data,
      message: resolved ? 'Anomaly marked as resolved' : 'Anomaly marked as unresolved'
    })

  } catch (error) {
    console.error('Anomaly update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update anomaly status' 
      },
      { status: 500 }
    )
  }
}
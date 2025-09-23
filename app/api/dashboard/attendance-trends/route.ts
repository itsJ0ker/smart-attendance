// app/api/dashboard/attendance-trends/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'week'
    const days = timeRange === 'month' ? 30 : 7
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    
    // Get attendance data grouped by date
    const { data: attendanceData, error } = await supabase
      .from('attendance')
      .select(`
        marked_at,
        status,
        lecture:lectures!inner(
          total_students
        )
      `)
      .gte('marked_at', startDate.toISOString())
      .lte('marked_at', endDate.toISOString())
      .order('marked_at', { ascending: true })

    if (error) throw error

    // Group attendance by date and calculate percentages
    const dailyStats = new Map()
    
    attendanceData?.forEach(record => {
      const date = new Date(record.marked_at).toDateString()
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, {
          date,
          total: 0,
          present: 0,
          late: 0,
          absent: 0
        })
      }
      
      const dayStats = dailyStats.get(date)
      dayStats.total++
      
      if (record.status === 'present') {
        dayStats.present++
      } else if (record.status === 'late') {
        dayStats.late++
      } else {
        dayStats.absent++
      }
    })

    // Convert to array and calculate percentages
    const trendsData = Array.from(dailyStats.values()).map(day => ({
      date: day.date,
      attendance_percentage: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0,
      present_count: day.present,
      late_count: day.late,
      absent_count: day.absent,
      total_count: day.total
    }))

    // Fill in missing dates with 0 values
    const filledData = []
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateString = currentDate.toDateString()
      
      const existingData = trendsData.find(d => d.date === dateString)
      if (existingData) {
        filledData.push({
          ...existingData,
          label: currentDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        })
      } else {
        filledData.push({
          date: dateString,
          label: currentDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          attendance_percentage: 0,
          present_count: 0,
          late_count: 0,
          absent_count: 0,
          total_count: 0
        })
      }
    }

    // Calculate overall statistics
    const totalRecords = attendanceData?.length || 0
    const presentRecords = attendanceData?.filter(a => a.status === 'present').length || 0
    const lateRecords = attendanceData?.filter(a => a.status === 'late').length || 0
    const absentRecords = attendanceData?.filter(a => a.status === 'absent').length || 0
    
    const overallStats = {
      total_records: totalRecords,
      present_records: presentRecords,
      late_records: lateRecords,
      absent_records: absentRecords,
      overall_percentage: totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: {
        trends: filledData,
        statistics: overallStats
      }
    })

  } catch (error) {
    console.error('Attendance trends error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance trends' 
      },
      { status: 500 }
    )
  }
}
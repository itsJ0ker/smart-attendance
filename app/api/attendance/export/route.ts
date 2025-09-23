// app/api/attendance/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, department } = await request.json()

    let query = supabaseAdmin
      .from('attendance')
      .select(`
        marked_at,
        students!inner(name, student_id, department),
        lectures!inner(subjects!inner(name))
      `)
      .gte('marked_at', startDate)
      .lte('marked_at', endDate)

    if (department) {
      query = query.eq('students.department', department)
    }

    const { data, error } = await query

    if (error) throw error

    // Convert to Excel
    const worksheet = XLSX.utils.json_to_sheet(data.map((record: any) => ({
      'Student Name': record.students.name,
      'Student ID': record.students.student_id,
      'Department': record.students.department,
      'Subject': record.lectures.subjects.name,
      'Date': new Date(record.marked_at).toLocaleDateString(),
      'Time': new Date(record.marked_at).toLocaleTimeString()
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=attendance-${new Date().toISOString()}.xlsx`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
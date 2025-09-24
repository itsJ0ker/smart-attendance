// app/api/teachers/[id]/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id

    // Verify teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Get teacher's subjects through lectures
    const { data: lectures, error: lecturesError } = await supabase
      .from('lectures')
      .select(`
        id,
        subject_id,
        created_at,
        subjects!inner(id, name, code)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (lecturesError) {
      console.error('Error fetching teacher lectures:', lecturesError)
      return NextResponse.json(
        { error: 'Failed to fetch teacher data' },
        { status: 500 }
      )
    }

    // Group lectures by subject and calculate statistics
    const subjectMap = new Map()
    
    for (const lecture of lectures || []) {
      const subjectId = lecture.subject_id
      const subject = lecture.subjects
      
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          lectures: [],
          total_lectures: 0,
          total_attendance: 0
        })
      }
      
      const subjectData = subjectMap.get(subjectId)
      subjectData.lectures.push(lecture.id)
      subjectData.total_lectures++
    }

    // Enhance subjects with attendance statistics
    const enhancedCourses = await Promise.all(
      Array.from(subjectMap.values()).map(async (subject) => {
        // Get attendance data for this subject's lectures
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('id, lecture_id')
          .in('lecture_id', subject.lectures)

        const totalAttendance = attendanceData?.length || 0
        // Since attendance table only stores present records, all are considered present
        const averageAttendance = subject.total_lectures > 0 ? 
          Math.round((totalAttendance / subject.total_lectures) * 100) : 0

        // Get unique students count (enrolled count approximation)
        const { data: uniqueStudents } = await supabase
          .from('attendance')
          .select('student_id')
          .in('lecture_id', subject.lectures)

        const uniqueStudentIds = new Set(uniqueStudents?.map(a => a.student_id) || [])
        const enrolledCount = uniqueStudentIds.size

        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          enrolled_count: enrolledCount,
          total_lectures: subject.total_lectures,
          average_attendance: averageAttendance
        }
      })
    )

    return NextResponse.json({
      courses: enhancedCourses
    })

  } catch (error) {
    console.error('Error in teacher courses API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
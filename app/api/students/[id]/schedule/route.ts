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
    const studentId = params.id
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Get all lectures with subjects that the student has attended (to determine their "enrolled" subjects)
    const { data: studentAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        lecture_id,
        lectures!inner(
          subject_id
        )
      `)
      .eq('student_id', studentId)

    if (attendanceError) {
      throw attendanceError
    }

    // Get unique subject IDs the student has attended
    const attendedSubjectIds = [...new Set(studentAttendance?.map(a => a.lectures.subject_id) || [])]

    if (attendedSubjectIds.length === 0) {
      // Student has no attendance history, return empty schedule
      return NextResponse.json({
        date,
        todaysSchedule: [],
        upcomingLectures: [],
        statistics: {
          totalToday: 0,
          attendedToday: 0,
          missedToday: 0,
          upcomingCount: 0
        }
      })
    }

    // Get all lectures for the subjects the student has attended
    const { data: allLectures, error: lecturesError } = await supabase
      .from('lectures')
      .select(`
        id,
        subject_id,
        teacher_id,
        qr_code,
        created_at,
        subjects!inner(
          id,
          name,
          code
        ),
        teachers!inner(
          id,
          users!inner(
            name
          )
        )
      `)
      .in('subject_id', attendedSubjectIds)
      .order('created_at', { ascending: true })

    if (lecturesError) {
      throw lecturesError
    }

    // Get attendance records for this student
    const { data: attendanceRecords, error: attendanceRecordsError } = await supabase
      .from('attendance')
      .select('lecture_id, marked_at')
      .eq('student_id', studentId)

    if (attendanceRecordsError) {
      throw attendanceRecordsError
    }

    const attendanceMap = new Map()
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.lecture_id, record)
    })

    // Filter lectures for the specified date
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const todaysLectures: any[] = []

    allLectures?.forEach(lecture => {
      const lectureDate = new Date(lecture.created_at)
      
      // Check if lecture is on the target date
      if (lectureDate >= startOfDay && lectureDate < endOfDay) {
        const attendanceRecord = attendanceMap.get(lecture.id)

        todaysLectures.push({
          id: lecture.id,
          title: `${lecture.subjects.name} Lecture`,
          startTime: lecture.created_at,
          endTime: new Date(new Date(lecture.created_at).getTime() + 2 * 60 * 60 * 1000).toISOString(), // Assume 2 hour lectures
          location: 'Classroom', // Default location since not in schema
          course: {
            id: lecture.subjects.id,
            name: lecture.subjects.name,
            code: lecture.subjects.code
          },
          teacher: lecture.teachers.users.name,
          attendance: attendanceRecord ? {
            id: attendanceRecord.lecture_id,
            status: 'present',
            markedAt: attendanceRecord.marked_at
          } : null,
          status: getScheduleStatus(lecture.created_at, new Date(new Date(lecture.created_at).getTime() + 2 * 60 * 60 * 1000).toISOString(), attendanceRecord)
        })
      }
    })

    // Sort by start time
    todaysLectures.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    // Get upcoming lectures (next 7 days)
    const upcomingStart = new Date(endOfDay)
    const upcomingEnd = new Date(upcomingStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcomingLectures: any[] = []

    allLectures?.forEach(lecture => {
      const lectureDate = new Date(lecture.created_at)
      
      if (lectureDate >= upcomingStart && lectureDate < upcomingEnd) {
        upcomingLectures.push({
          id: lecture.id,
          title: `${lecture.subjects.name} Lecture`,
          startTime: lecture.created_at,
          endTime: new Date(new Date(lecture.created_at).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Classroom',
          course: {
            id: lecture.subjects.id,
            name: lecture.subjects.name,
            code: lecture.subjects.code
          },
          teacher: lecture.teachers.users.name
        })
      }
    })

    // Sort upcoming lectures by start time
    upcomingLectures.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )

    const response = {
      date,
      todaysSchedule: todaysLectures,
      upcomingLectures: upcomingLectures.slice(0, 5), // Limit to 5 upcoming
      statistics: {
        totalToday: todaysLectures.length,
        attendedToday: todaysLectures.filter(l => l.attendance?.status === 'present').length,
        missedToday: todaysLectures.filter(l => l.status === 'missed').length,
        upcomingCount: upcomingLectures.length
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get student schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student schedule' },
      { status: 500 }
    )
  }
}

function getScheduleStatus(startTime: string, endTime: string, attendanceRecord: any) {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (attendanceRecord) {
    return attendanceRecord.status // present, late, absent
  }

  if (now < start) {
    return 'upcoming'
  } else if (now >= start && now <= end) {
    return 'ongoing'
  } else {
    return 'missed' // Past lecture with no attendance record
  }
}
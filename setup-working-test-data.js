// Setup test data that works with existing database structure
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupWorkingTestData() {
  try {
    console.log('🚀 Setting up working test data...\n')

    // Create test admin
    const adminPassword = await bcrypt.hash('admin123', 12)
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@test.com',
        password_hash: adminPassword,
        name: 'System Admin',
        role: 'admin',
        status: 'active',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single()

    if (adminError && adminError.code !== '23505') {
      console.error('❌ Failed to create admin:', adminError)
    } else {
      console.log('✅ Admin user created/updated: admin@test.com / admin123')
    }

    // Create test teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12)
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .upsert({
        email: 'teacher@test.com',
        password_hash: teacherPassword,
        name: 'John Teacher',
        role: 'teacher',
        status: 'active',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single()

    if (teacherError && teacherError.code !== '23505') {
      console.error('❌ Failed to create teacher:', teacherError)
    } else {
      console.log('✅ Teacher user created/updated: teacher@test.com / teacher123')
    }

    // Create test students
    const students = [
      { name: 'Alice Johnson', email: 'alice@test.com' },
      { name: 'Bob Wilson', email: 'bob@test.com' },
      { name: 'Carol Davis', email: 'carol@test.com' },
      { name: 'David Brown', email: 'david@test.com' },
      { name: 'Eva Martinez', email: 'eva@test.com' }
    ]

    const studentPassword = await bcrypt.hash('student123', 12)
    
    for (const student of students) {
      const { error: studentError } = await supabase
        .from('users')
        .upsert({
          email: student.email,
          password_hash: studentPassword,
          name: student.name,
          role: 'student',
          status: 'active',
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' })

      if (studentError && studentError.code !== '23505') {
        console.error(`❌ Failed to create student ${student.name}:`, studentError)
      } else {
        console.log(`✅ Student ${student.name} created/updated`)
      }
    }

    // Get teacher ID for creating lectures
    const { data: teacherData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'teacher@test.com')
      .single()

    if (teacherData) {
      // Create some test lectures for today
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      const lectures = [
        {
          title: 'Introduction to Computer Science',
          course_code: 'CS101',
          teacher_id: teacherData.id,
          scheduled_time: `${todayStr}T09:00:00Z`,
          duration: 90,
          location: 'Room A101',
          qr_code: `cs101-${Date.now()}`,
          status: 'scheduled'
        },
        {
          title: 'Data Structures and Algorithms',
          course_code: 'CS201',
          teacher_id: teacherData.id,
          scheduled_time: `${todayStr}T11:00:00Z`,
          duration: 90,
          location: 'Room B202',
          qr_code: `cs201-${Date.now()}`,
          status: 'scheduled'
        },
        {
          title: 'Database Systems',
          course_code: 'CS301',
          teacher_id: teacherData.id,
          scheduled_time: `${todayStr}T14:00:00Z`,
          duration: 90,
          location: 'Room C303',
          qr_code: `cs301-${Date.now()}`,
          status: 'scheduled'
        }
      ]

      for (const lecture of lectures) {
        const { error: lectureError } = await supabase
          .from('lectures')
          .upsert(lecture, { onConflict: 'qr_code' })

        if (lectureError) {
          console.error(`❌ Failed to create lecture ${lecture.title}:`, lectureError)
        } else {
          console.log(`✅ Lecture ${lecture.title} created/updated`)
        }
      }

      // Create some sample attendance records
      const { data: studentsData } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student')
        .limit(3)

      const { data: lecturesData } = await supabase
        .from('lectures')
        .select('id')
        .eq('teacher_id', teacherData.id)
        .limit(2)

      if (studentsData && lecturesData && studentsData.length > 0 && lecturesData.length > 0) {
        for (const student of studentsData) {
          for (const lecture of lecturesData) {
            const { error: attendanceError } = await supabase
              .from('attendance')
              .upsert({
                student_id: student.id,
                lecture_id: lecture.id,
                status: Math.random() > 0.3 ? 'present' : 'absent',
                marked_at: new Date().toISOString()
              }, { onConflict: 'student_id,lecture_id' })

            if (attendanceError) {
              console.error('❌ Failed to create attendance record:', attendanceError)
            }
          }
        }
        console.log('✅ Sample attendance records created')
      }
    }

    console.log('\n🎉 Working test data setup complete!')
    console.log('\n📋 Test Accounts:')
    console.log('Admin: admin@test.com / admin123')
    console.log('Teacher: teacher@test.com / teacher123')
    console.log('Students: alice@test.com, bob@test.com, carol@test.com, david@test.com, eva@test.com / student123')
    console.log('Original Student: joijoi00666@gmail.com / password123')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

setupWorkingTestData()
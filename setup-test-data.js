// Setup test data for the QR attendance system
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTestData() {
  try {
    console.log('🚀 Setting up test data...\n')

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
      console.log('✅ Admin user created/updated')
    }

    // Create test teacher
    const teacherPassword = await bcrypt.hash('teacher123', 12)
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .upsert({
        email: 'teacher@test.com',
        password_hash: teacherPassword,
        name: 'Dr. John Smith',
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
      return
    } else {
      console.log('✅ Teacher user created/updated')
    }

    // Get teacher ID for courses
    const { data: teacherData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'teacher@test.com')
      .single()

    const teacherId = teacherData?.id

    if (!teacherId) {
      console.error('❌ Could not get teacher ID')
      return
    }

    // Create test courses
    const courses = [
      {
        name: 'Computer Science Fundamentals',
        code: 'CS101',
        description: 'Introduction to computer science concepts',
        teacher_id: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        description: 'Advanced data structures and algorithm design',
        teacher_id: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: 'Web Development',
        code: 'CS301',
        description: 'Modern web development with React and Node.js',
        teacher_id: teacherId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    for (const course of courses) {
      const { error: courseError } = await supabase
        .from('courses')
        .upsert(course, { onConflict: 'code' })

      if (courseError && courseError.code !== '23505') {
        console.error(`❌ Failed to create course ${course.code}:`, courseError)
      } else {
        console.log(`✅ Course ${course.code} created/updated`)
      }
    }

    // Create some test students
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

    // Create some test lectures for today
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, name, code')
      .eq('teacher_id', teacherId)

    if (coursesData && coursesData.length > 0) {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      for (let i = 0; i < coursesData.length; i++) {
        const course = coursesData[i]
        const lectureTime = new Date(today)
        lectureTime.setHours(9 + i * 2, 0, 0, 0) // 9 AM, 11 AM, 1 PM

        const { error: lectureError } = await supabase
          .from('lectures')
          .upsert({
            course_id: course.id,
            title: `${course.name} - Lecture ${i + 1}`,
            description: `Today's lecture for ${course.name}`,
            date: todayStr,
            start_time: lectureTime.toTimeString().split(' ')[0],
            end_time: new Date(lectureTime.getTime() + 2 * 60 * 60 * 1000).toTimeString().split(' ')[0], // +2 hours
            location: `Room ${101 + i}`,
            qr_code: `qr_${course.code}_${todayStr}_${i}`,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'course_id,date,start_time' })

        if (lectureError && lectureError.code !== '23505') {
          console.error(`❌ Failed to create lecture for ${course.name}:`, lectureError)
        } else {
          console.log(`✅ Lecture created for ${course.name}`)
        }
      }
    }

    console.log('\n🎉 Test data setup complete!')
    console.log('\n📋 Test Accounts:')
    console.log('Admin: admin@test.com / admin123')
    console.log('Teacher: teacher@test.com / teacher123')
    console.log('Student: alice@test.com / student123 (and others)')
    console.log('Original Student: joijoi00666@gmail.com / password123')

  } catch (error) {
    console.error('❌ Error setting up test data:', error)
  }
}

setupTestData()
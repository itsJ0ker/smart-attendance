// Setup proper test data with correct database structure
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProperTestData() {
  try {
    console.log('🚀 Setting up proper test data...\n')

    // Create test admin user
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

    console.log('✅ Admin user created/updated: admin@test.com / admin123')

    // Create test teacher user
    const teacherPassword = await bcrypt.hash('teacher123', 12)
    const { data: teacherUser, error: teacherUserError } = await supabase
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

    console.log('✅ Teacher user created/updated: teacher@test.com / teacher123')

    // Create teacher record in teachers table
    if (teacherUser) {
      const { error: teacherRecordError } = await supabase
        .from('teachers')
        .upsert({
          id: teacherUser.id,
          user_id: teacherUser.id,
          employee_id: 'T001',
          department: 'Computer Science',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (!teacherRecordError) {
        console.log('✅ Teacher record created in teachers table')
      }
    }

    // Create test student users and records
    const students = [
      { name: 'Alice Johnson', email: 'alice@test.com', student_id: 'S001' },
      { name: 'Bob Wilson', email: 'bob@test.com', student_id: 'S002' },
      { name: 'Carol Davis', email: 'carol@test.com', student_id: 'S003' },
      { name: 'David Brown', email: 'david@test.com', student_id: 'S004' },
      { name: 'Eva Martinez', email: 'eva@test.com', student_id: 'S005' }
    ]

    const studentPassword = await bcrypt.hash('student123', 12)
    
    for (const student of students) {
      const { data: studentUser, error: studentUserError } = await supabase
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
        .select()
        .single()

      if (studentUser) {
        // Create student record in students table
        await supabase
          .from('students')
          .upsert({
            id: studentUser.id,
            user_id: studentUser.id,
            student_id: student.student_id,
            enrollment_year: 2024,
            created_at: new Date().toISOString()
          }, { onConflict: 'id' })

        console.log(`✅ Student ${student.name} created/updated`)
      }
    }

    // Create test subjects
    const subjects = [
      { name: 'Introduction to Computer Science', code: 'CS101' },
      { name: 'Data Structures and Algorithms', code: 'CS201' },
      { name: 'Database Systems', code: 'CS301' }
    ]

    const subjectIds = []
    for (const subject of subjects) {
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .upsert({
          name: subject.name,
          code: subject.code,
          credits: 3,
          created_at: new Date().toISOString()
        }, { onConflict: 'code' })
        .select()
        .single()

      if (subjectData) {
        subjectIds.push(subjectData.id)
        console.log(`✅ Subject ${subject.name} created/updated`)
      }
    }

    // Create test lectures for today
    if (teacherUser && subjectIds.length > 0) {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      const lectures = [
        {
          subject_id: subjectIds[0],
          teacher_id: teacherUser.id,
          qr_code: `cs101-${Date.now()}-1`,
          qr_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          created_at: new Date().toISOString()
        },
        {
          subject_id: subjectIds[1],
          teacher_id: teacherUser.id,
          qr_code: `cs201-${Date.now()}-2`,
          qr_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          subject_id: subjectIds[2],
          teacher_id: teacherUser.id,
          qr_code: `cs301-${Date.now()}-3`,
          qr_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ]

      const lectureIds = []
      for (const lecture of lectures) {
        const { data: lectureData, error: lectureError } = await supabase
          .from('lectures')
          .insert(lecture)
          .select()
          .single()

        if (lectureData) {
          lectureIds.push(lectureData.id)
          console.log(`✅ Lecture created with QR: ${lecture.qr_code}`)
        } else {
          console.error('❌ Failed to create lecture:', lectureError)
        }
      }

      // Create sample attendance records
      const { data: studentsData } = await supabase
        .from('students')
        .select('id')
        .limit(3)

      if (studentsData && lectureIds.length > 0) {
        for (const student of studentsData) {
          for (const lectureId of lectureIds.slice(0, 2)) { // Only first 2 lectures
            const { error: attendanceError } = await supabase
              .from('attendance')
              .insert({
                student_id: student.id,
                lecture_id: lectureId,
                marked_at: new Date().toISOString()
              })

            if (attendanceError && attendanceError.code !== '23505') { // Ignore duplicate errors
              console.error('❌ Failed to create attendance record:', attendanceError)
            }
          }
        }
        console.log('✅ Sample attendance records created')
      }
    }

    console.log('\n🎉 Proper test data setup complete!')
    console.log('\n📋 Test Accounts:')
    console.log('Admin: admin@test.com / admin123')
    console.log('Teacher: teacher@test.com / teacher123')
    console.log('Students: alice@test.com, bob@test.com, carol@test.com, david@test.com, eva@test.com / student123')
    console.log('Original Student: joijoi00666@gmail.com / password123')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

setupProperTestData()
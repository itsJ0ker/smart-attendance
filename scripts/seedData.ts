// scripts/seedData.ts
import { supabaseAdmin } from '../lib/supabase'

export async function seedSampleData() {
  // Create sample admin user
  const { data: admin } = await supabaseAdmin
    .from('users')
    .insert([
      {
        email: 'admin@college.edu',
        password_hash: 'YWRtaW4=', // 'admin' in base64
        name: 'System Administrator',
        role: 'admin'
      }
    ])
    .select()
    .single()

  // Create sample teacher
  const { data: teacher } = await supabaseAdmin
    .from('users')
    .insert([
      {
        email: 'prof.smith@college.edu',
        password_hash: 'dGVhY2hlcg==', // 'teacher' in base64
        name: 'Professor Smith',
        role: 'teacher'
      }
    ])
    .select()
    .single()

  if (teacher) {
    await supabaseAdmin
      .from('teachers')
      .insert([
        {
          id: teacher.id,
          teacher_id: 'T001',
          department: 'Computer Science',
          subjects: ['CS101', 'CS202']
        }
      ])
  }

  // Create sample students
  const students = [
    {
      email: 'john.doe@student.college.edu',
      password_hash: 'c3R1ZGVudA==', // 'student' in base64
      name: 'John Doe',
      role: 'student'
    },
    {
      email: 'jane.smith@student.college.edu', 
      password_hash: 'c3R1ZGVudA==',
      name: 'Jane Smith',
      role: 'student'
    }
  ]

  for (const studentData of students) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert([studentData])
      .select()
      .single()

    if (user) {
      await supabaseAdmin
        .from('students')
        .insert([
          {
            id: user.id,
            student_id: `S${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            department: 'Computer Science',
            semester: 3
          }
        ])
    }
  }

  console.log('Sample data seeded successfully!')
}

// Run if this file is executed directly
if (require.main === module) {
  seedSampleData().catch(console.error)
}
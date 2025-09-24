// Check what tables exist in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...\n')

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.log('❌ Users table:', usersError.message)
    } else {
      console.log('✅ Users table exists')
    }

    // Check lectures table
    const { data: lectures, error: lecturesError } = await supabase
      .from('lectures')
      .select('*')
      .limit(1)

    if (lecturesError) {
      console.log('❌ Lectures table:', lecturesError.message)
    } else {
      console.log('✅ Lectures table exists')
    }

    // Check attendance table
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1)

    if (attendanceError) {
      console.log('❌ Attendance table:', attendanceError.message)
    } else {
      console.log('✅ Attendance table exists')
    }

    // Check courses table
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1)

    if (coursesError) {
      console.log('❌ Courses table:', coursesError.message)
    } else {
      console.log('✅ Courses table exists')
    }

    console.log('\n🎉 Database check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDatabase()
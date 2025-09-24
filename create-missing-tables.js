// Create missing tables for the QR attendance system
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createMissingTables() {
  try {
    console.log('🚀 Creating missing tables...\n')

    // Create courses table
    const { error: coursesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS courses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          code VARCHAR(20) NOT NULL,
          teacher_id UUID REFERENCES users(id),
          semester VARCHAR(20) NOT NULL,
          year INTEGER NOT NULL,
          credits INTEGER NOT NULL DEFAULT 3,
          max_students INTEGER DEFAULT 50,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (coursesError) {
      console.error('❌ Failed to create courses table:', coursesError)
    } else {
      console.log('✅ Courses table created/verified')
    }

    // Create course_enrollments table
    const { error: enrollmentsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS course_enrollments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
          student_id UUID REFERENCES users(id) ON DELETE CASCADE,
          enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'active',
          UNIQUE(course_id, student_id)
        );
      `
    })

    if (enrollmentsError) {
      console.error('❌ Failed to create course_enrollments table:', enrollmentsError)
    } else {
      console.log('✅ Course enrollments table created/verified')
    }

    console.log('\n🎉 Missing tables creation complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createMissingTables()
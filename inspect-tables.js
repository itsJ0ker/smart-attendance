// Inspect table structures by trying to insert empty records
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectTables() {
  try {
    console.log('🔍 Inspecting table structures...\n')

    // Try to insert an empty lecture to see what columns are required
    const { error: lectureError } = await supabase
      .from('lectures')
      .insert({})

    console.log('📋 Lectures table error (shows required columns):')
    console.log(lectureError)

    // Try to insert an empty attendance record
    const { error: attendanceError } = await supabase
      .from('attendance')
      .insert({})

    console.log('\n📋 Attendance table error (shows required columns):')
    console.log(attendanceError)

    console.log('\n🎉 Inspection complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

inspectTables()
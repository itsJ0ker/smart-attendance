// Check lectures table structure
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLecturesStructure() {
  try {
    console.log('🔍 Checking lectures table structure...\n')

    // Get all lectures to see the structure
    const { data: lectures, error } = await supabase
      .from('lectures')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (lectures && lectures.length > 0) {
      console.log('📋 Sample lecture record:')
      console.log(JSON.stringify(lectures[0], null, 2))
    } else {
      console.log('📋 No lectures found in database')
    }

    // Also check users table structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(2)

    if (usersError) {
      console.error('❌ Users error:', usersError)
    } else if (users && users.length > 0) {
      console.log('\n👤 Sample user record:')
      console.log(JSON.stringify(users[0], null, 2))
    }

    console.log('\n🎉 Structure check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkLecturesStructure()
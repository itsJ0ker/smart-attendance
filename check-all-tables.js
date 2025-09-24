// Check all tables that exist
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllTables() {
  try {
    console.log('🔍 Checking all tables...\n')

    const tables = ['users', 'subjects', 'teachers', 'students', 'lectures', 'attendance', 'timetable']

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: exists`)
          if (data && data.length > 0) {
            console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`)
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }

    console.log('\n🎉 Table check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAllTables()
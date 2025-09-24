// Check current database schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  try {
    console.log('Checking current users table schema...\n')
    
    // Try to get one row to see the structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('Current columns in users table:')
      Object.keys(data[0]).forEach(column => {
        console.log(`- ${column}`)
      })
      console.log('\nSample data:')
      console.log(data[0])
    } else {
      console.log('Users table exists but has no data')
      
      // Try to insert a test record to see what columns are required
      console.log('\nTrying to determine required columns...')
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: 'test@example.com',
          name: 'Test User',
          role: 'student'
        })
      
      if (insertError) {
        console.log('Insert error (this helps us understand the schema):')
        console.log(insertError)
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkSchema()
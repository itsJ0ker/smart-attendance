// Test the fixed authentication
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  try {
    console.log('Testing authentication with current schema...\n')
    
    // First, let's create a test user
    const testEmail = 'joijoi00666@gmail.com'
    const testPassword = 'password123'
    const passwordHash = await bcrypt.hash(testPassword, 12)
    
    console.log('1. Creating test user...')
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .upsert({
        email: testEmail,
        password_hash: passwordHash,
        name: 'Test User',
        role: 'student'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
    } else {
      console.log('✅ User created/updated successfully')
    }
    
    console.log('\n2. Testing login query (without status filter)...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (userError) {
      console.error('❌ Login query error:', userError)
      return
    }
    
    console.log('✅ User found:', {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      hasPasswordHash: !!userData.password_hash
    })
    
    console.log('\n3. Testing password verification...')
    const isValidPassword = await bcrypt.compare(testPassword, userData.password_hash)
    
    if (isValidPassword) {
      console.log('✅ Password verification successful!')
      console.log('\n🎉 Authentication should now work!')
    } else {
      console.log('❌ Password verification failed')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAuth()
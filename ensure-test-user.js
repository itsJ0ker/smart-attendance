// Ensure test user exists with correct password
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function ensureTestUser() {
  try {
    const email = 'joijoi00666@gmail.com'
    const password = 'password123'
    const passwordHash = await bcrypt.hash(password, 12)
    
    console.log('Ensuring test user exists with correct password...\n')
    
    // Delete existing user if any
    await supabase.from('users').delete().eq('email', email)
    
    // Create fresh user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email,
        password_hash: passwordHash,
        name: 'Test User',
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Failed to create user:', insertError)
      return
    }
    
    console.log('✅ Test user created successfully!')
    console.log('User ID:', newUser.id)
    console.log('Email:', newUser.email)
    console.log('Password:', password)
    
    // Verify password works
    const testComparison = await bcrypt.compare(password, newUser.password_hash)
    console.log('Password verification:', testComparison ? '✅ WORKS' : '❌ FAILED')
    
    console.log('\n🎉 You can now login with:')
    console.log('Email: joijoi00666@gmail.com')
    console.log('Password: password123')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

ensureTestUser()
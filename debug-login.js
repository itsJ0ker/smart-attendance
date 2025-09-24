// Debug login issue step by step
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLogin() {
  try {
    const testEmail = 'joijoi00666@gmail.com'
    const testPassword = 'password123'
    
    console.log('🔍 DEBUGGING LOGIN ISSUE')
    console.log('========================\n')
    
    console.log('1. Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError)
      return
    }
    console.log('✅ Database connected. User count:', connectionTest[0].count)
    
    console.log('\n2. Looking for the test user...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
    
    if (userError) {
      console.error('❌ Query error:', userError)
      return
    }
    
    if (!userData || userData.length === 0) {
      console.log('❌ User not found! Let me create one...')
      
      // Create the user
      const passwordHash = await bcrypt.hash(testPassword, 12)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: testEmail,
          password_hash: passwordHash,
          name: 'Test User',
          role: 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (insertError) {
        console.error('❌ Failed to create user:', insertError)
        return
      }
      
      console.log('✅ User created successfully!')
      console.log('Now try logging in again...')
      return
    }
    
    const user = userData[0]
    console.log('✅ User found!')
    console.log('User data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash ? user.password_hash.length : 0,
      passwordHashStart: user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'none'
    })
    
    console.log('\n3. Testing password comparison...')
    if (!user.password_hash) {
      console.error('❌ No password hash found in database!')
      return
    }
    
    console.log('Comparing password:', testPassword)
    console.log('Against hash:', user.password_hash.substring(0, 20) + '...')
    
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('\n❌ Password comparison failed!')
      console.log('Let me update the password hash...')
      
      const newPasswordHash = await bcrypt.hash(testPassword, 12)
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('email', testEmail)
      
      if (updateError) {
        console.error('❌ Failed to update password:', updateError)
        return
      }
      
      console.log('✅ Password hash updated! Try logging in now.')
    } else {
      console.log('✅ Password comparison successful!')
      console.log('\n🎉 Login should work now!')
    }
    
    console.log('\n4. Testing the exact same query your app uses...')
    const { data: appTestData, error: appTestError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (appTestError) {
      console.error('❌ App query failed:', appTestError)
    } else {
      console.log('✅ App query successful!')
      const finalPasswordTest = await bcrypt.compare(testPassword, appTestData.password_hash)
      console.log('Final password test:', finalPasswordTest)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugLogin()
// Test database connection
// Run this with: node test-db-connection.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...')
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' })
    
    if (error) {
      console.error('Connection error:', error)
      return
    }
    
    console.log('✅ Connection successful! User count:', data)
    
    console.log('\n2. Testing specific query that fails...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'joijoi00666@gmail.com')
      .eq('status', 'active')
    
    if (userError) {
      console.error('❌ Query error:', userError)
    } else {
      console.log('✅ Query successful! Found users:', userData)
    }
    
    console.log('\n3. Testing table structure...')
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table structure error:', tableError)
    } else {
      console.log('✅ Table structure:', tableData.length > 0 ? Object.keys(tableData[0]) : 'No data')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testConnection()
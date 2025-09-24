// Test script to check database connection
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing database connection...');
console.log('');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📧 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? 'Set' : 'NOT SET');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Environment variables not set properly!');
  console.log('Please check your .env.local file and make sure both keys are set.');
  process.exit(1);
}

if (supabaseAnonKey === 'YOUR_ANON_KEY_HERE') {
  console.log('❌ Please replace YOUR_ANON_KEY_HERE with your actual Supabase anon key!');
  console.log('Go to: https://hdiyzltmpslifulgendv.supabase.co/project/default/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔄 Testing connection to users table...');
    
    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:');
      console.log('Error:', error.message);
      console.log('');
      console.log('This might mean:');
      console.log('1. The users table doesn\'t exist');
      console.log('2. Your API key is wrong');
      console.log('3. There\'s a permission issue');
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Found', data.length, 'users in the database');
    
    if (data.length > 0) {
      console.log('👤 Sample user:', data[0].email);
    } else {
      console.log('📝 No users found - need to create admin user');
    }

  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

testConnection();

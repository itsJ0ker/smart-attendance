// Simple script to create admin user
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Your Supabase URL from the error message
const supabaseUrl = 'https://hdiyzltmpslifulgendv.supabase.co';

console.log('🔧 Creating admin user in your Supabase database...');
console.log('📧 Database URL:', supabaseUrl);
console.log('');

// You need to get your anon key from Supabase
// Go to: https://hdiyzltmpslifulgendv.supabase.co/project/default/settings/api
// Copy the "anon public" key and replace the placeholder below
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaXl6bHRtcHNsaWZ1bGdlbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzcyNjcsImV4cCI6MjA3NDIxMzI2N30.IhflrrCvfHp5H-y3B8SFOCmG6cFDagPCREDQFazql-c';

if (supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaXl6bHRtcHNsaWZ1bGdlbmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzcyNjcsImV4cCI6MjA3NDIxMzI2N30.IhflrrCvfHp5H-y3B8SFOCmG6cFDagPCREDQFazql-c') {
  console.log('❌ Please get your Supabase anon key:');
  console.log('');
  console.log('1. Go to: https://hdiyzltmpslifulgendv.supabase.co/project/default/settings/api');
  console.log('2. Copy the "anon public" key (starts with eyJ...)');
  console.log('3. Replace YOUR_SUPABASE_ANON_KEY_HERE in this script with your actual key');
  console.log('4. Run this script again');
  console.log('');
  console.log('Or create a .env.local file with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://hdiyzltmpslifulgendv.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('🚀 Creating admin user...');

  try {
    // Create admin user with basic fields
    const adminData = {
      email: 'admin@college.edu',
      password: 'admin123!',
      name: 'System Administrator',
      role: 'admin'
    };

    console.log(`Creating admin user: ${adminData.email}...`);
    
    // Hash the password
    const passwordHash = await bcrypt.hash(adminData.password, 12);
    
    // Try to create user with minimal required fields
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email: adminData.email,
        password_hash: passwordHash,
        name: adminData.name,
        role: adminData.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating admin user:`, error.message);
      
      // If user already exists, try to update password
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        console.log(`🔄 Admin user already exists, updating password...`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            password_hash: passwordHash,
            updated_at: new Date().toISOString()
          })
          .eq('email', adminData.email);
          
        if (updateError) {
          console.error(`❌ Error updating admin password:`, updateError.message);
        } else {
          console.log(`✅ Updated password for admin user`);
        }
      }
    } else {
      console.log(`✅ Created admin user: ${adminData.email}`);
    }

    console.log('');
    console.log('✅ Admin user setup completed!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('Email: admin@college.edu');
    console.log('Password: admin123!');
    console.log('');
    console.log('🔗 Go to your app and try logging in with these credentials');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

createAdmin();

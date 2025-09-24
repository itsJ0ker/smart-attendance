// Quick user creation script
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Use the URL from your error message
const supabaseUrl = 'https://hdiyzltmpslifulgendv.supabase.co';

console.log('🔧 Creating users in your Supabase database...');
console.log('📧 Database URL:', supabaseUrl);
console.log('');

// You need to get your anon key from Supabase project settings
// For now, let's try with a placeholder and show you what to do
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key_here';

if (supabaseAnonKey === 'your_anon_key_here') {
  console.log('❌ Please set your Supabase anon key:');
  console.log('1. Go to your Supabase project: https://hdiyzltmpslifulgendv.supabase.co');
  console.log('2. Go to Settings > API');
  console.log('3. Copy the "anon public" key');
  console.log('4. Set it in your .env.local file as NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here');
  console.log('5. Run this script again');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUsers() {
  console.log('🚀 Creating users...');

  const users = [
    {
      email: 'admin@college.edu',
      password: 'admin123!',
      name: 'System Administrator',
      role: 'admin'
    },
    {
      email: 'teacher@college.edu', 
      password: 'teacher123!',
      name: 'Professor Smith',
      role: 'teacher'
    },
    {
      email: 'student@college.edu',
      password: 'student123!', 
      name: 'John Doe',
      role: 'student'
    }
  ];

  for (const userData of users) {
    try {
      console.log(`Creating user: ${userData.email}...`);
      
      // Hash the password
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      // Try to create user with minimal fields first
      const { data: user, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
        
        // If user already exists, try to update password
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          console.log(`🔄 User ${userData.email} already exists, updating password...`);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              password_hash: passwordHash,
              updated_at: new Date().toISOString()
            })
            .eq('email', userData.email);
            
          if (updateError) {
            console.error(`❌ Error updating ${userData.email}:`, updateError.message);
          } else {
            console.log(`✅ Updated password for ${userData.email}`);
          }
        }
      } else {
        console.log(`✅ Created user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${userData.email}:`, error.message);
    }
  }

  console.log('');
  console.log('✅ User creation completed!');
  console.log('');
  console.log('📋 Test these credentials:');
  console.log('Admin: admin@college.edu / admin123!');
  console.log('Teacher: teacher@college.edu / teacher123!');
  console.log('Student: student@college.edu / student123!');
  console.log('');
  console.log('🔗 Go to your app and try logging in with these credentials');
}

createUsers().catch(console.error);

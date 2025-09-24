// Run database setup
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runDatabaseSetup() {
  try {
    console.log('🚀 Running database setup...\n')
    
    const sqlContent = fs.readFileSync('complete-database-setup.sql', 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error)
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err)
        }
      }
    }
    
    console.log('\n🎉 Database setup complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

runDatabaseSetup()
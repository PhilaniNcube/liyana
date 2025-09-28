// Test if tables exist in local database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:55431'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkTables() {
  console.log('🔍 Checking if tables exist in local database...\n')
  
  try {
    // Check main tables
    const tablesToCheck = ['applications', 'profiles', 'policies', 'approved_loans', 'parties']
    
    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`✅ ${tableName}: Table exists (${data?.length || 0} sample records)`)
      }
    }
    
    // Check RLS policies using direct SQL
    console.log('\n🔒 Checking RLS policies...')
    const { data: policies, error: policyError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, cmd
          FROM pg_policies 
          WHERE tablename IN ('applications', 'profiles')
          ORDER BY tablename, policyname;
        `
      })
    
    if (policyError) {
      console.log('❌ Error checking policies:', policyError.message)
    } else {
      console.log(`📋 Found ${policies?.length || 0} RLS policies:`)
      policies?.forEach(p => console.log(`   - ${p.tablename}.${p.policyname} (${p.cmd})`))
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkTables()
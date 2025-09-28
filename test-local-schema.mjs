// Test local database schema
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:55431'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 Testing local database schema...\n')

async function testSchema() {
  try {
    // Test if tables exist by checking a few key tables
    const tables = ['applications', 'profiles', 'policies', 'parties', 'documents', 'api_checks']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Table exists and accessible`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
    
    console.log('\n🔍 Checking RLS status...')
    
    // Check RLS policies
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('applications', 'profiles') ORDER BY tablename`
      })
      
    if (rlsError) {
      console.log('❌ Error checking RLS:', rlsError.message)
    } else {
      rlsData?.forEach(row => {
        const status = row.rowsecurity ? '✅ Enabled' : '❌ Disabled' 
        console.log(`   ${row.tablename}: RLS ${status}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testSchema()
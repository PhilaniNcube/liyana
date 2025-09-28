// Check local RLS policies 
import { createClient } from '@supabase/supabase-js'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:55431'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'  // Service key for admin access

console.log('🔍 Checking RLS policies on local database...\n')

// Create admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create regular client (subject to RLS)  
const supabaseClient = createClient(supabaseUrl, 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH')

async function checkRLSPolicies() {
  try {
    // Check if RLS is enabled on tables
    console.log('1. Checking if RLS is enabled...')
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['applications', 'profiles'])
      .eq('schemaname', 'public')
    
    if (rlsError) {
      console.log('❌ Error checking RLS status:', rlsError.message)
    } else {
      rlsStatus?.forEach(table => {
        const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED'
        console.log(`   ${table.tablename}: RLS ${status}`)
      })
    }
    
    // Check existing policies
    console.log('\n2. Checking existing policies...')
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename IN ('applications', 'profiles')
        ORDER BY tablename, policyname;
        `
      })
    
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message)
    } else {
      console.log(`   Found ${policies?.length || 0} policies`)
      policies?.forEach(policy => {
        console.log(`   📋 ${policy.tablename}.${policy.policyname} (${policy.cmd})`)
      })
    }
    
    // Test actual access
    console.log('\n3. Testing actual table access...')
    
    // Test without authentication
    console.log('   Testing without auth...')
    const { data: appsUnauth, error: appsUnauthError } = await supabaseClient
      .from('applications')  
      .select('id')
      .limit(1)
      
    if (appsUnauthError) {
      console.log('   ✅ Applications correctly blocked:', appsUnauthError.message)
    } else {
      console.log(`   ⚠️  Applications accessible without auth: ${appsUnauth?.length || 0} records`)
    }
    
    const { data: profilesUnauth, error: profilesUnauthError } = await supabaseClient
      .from('profiles')
      .select('id') 
      .limit(1)
      
    if (profilesUnauthError) {
      console.log('   ✅ Profiles correctly blocked:', profilesUnauthError.message)  
    } else {
      console.log(`   ⚠️  Profiles accessible without auth: ${profilesUnauth?.length || 0} records`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkRLSPolicies()
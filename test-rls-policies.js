// Test RLS policies for applications and profiles tables
import { createClient } from '@supabase/supabase-js'

// Local Supabase credentials from status
const supabaseUrl = 'http://127.0.0.1:55431'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLSPolicies() {
  console.log('Testing RLS policies...')
  
  try {
    // Test 1: Try to access applications without authentication (should fail or return empty)
    console.log('\n1. Testing applications access without auth...')
    const { data: appsUnauth, error: appsError } = await supabase
      .from('applications')
      .select('*')
    
    if (appsError) {
      console.log('✅ Applications correctly blocked without auth:', appsError.message)
    } else {
      console.log('⚠️  Applications returned data without auth:', appsUnauth?.length || 0, 'records')
    }
    
    // Test 2: Try to access profiles without authentication (should fail or return empty)  
    console.log('\n2. Testing profiles access without auth...')
    const { data: profilesUnauth, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.log('✅ Profiles correctly blocked without auth:', profilesError.message)
    } else {
      console.log('⚠️  Profiles returned data without auth:', profilesUnauth?.length || 0, 'records')
    }
    
    // Test 3: Check if RLS is enabled on both tables
    console.log('\n3. Checking RLS status...')
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, schemaname')
      .in('tablename', ['applications', 'profiles'])
    
    if (rlsError) {
      console.log('Error checking RLS status:', rlsError.message)
    } else {
      console.log('Tables found:', rlsStatus?.map(t => `${t.schemaname}.${t.tablename}`))
    }
    
    // Test 4: Try to create a test user and see if policies work with authentication
    console.log('\n4. Testing with anonymous auth...')
    
    // Sign in as anonymous user (if enabled)
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
    
    if (authError) {
      console.log('Anonymous auth not available:', authError.message)
    } else {
      console.log('✅ Anonymous auth successful, user ID:', authData.user?.id)
      
      // Now try accessing tables with auth
      const { data: appsAuth, error: appsAuthError } = await supabase
        .from('applications')
        .select('*')
        
      if (appsAuthError) {
        console.log('Applications with auth error:', appsAuthError.message)
      } else {
        console.log('Applications with auth returned:', appsAuth?.length || 0, 'records')
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
  }
}

testRLSPolicies()
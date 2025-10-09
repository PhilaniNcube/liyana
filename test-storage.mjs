// Test Supabase Storage functionality
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:55431'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 Testing Supabase Storage...\n')

async function testStorage() {
  try {
    // Test 1: List buckets
    console.log('1. Testing bucket access...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message)
    } else {
      console.log('✅ Storage accessible! Found', buckets?.length || 0, 'buckets')
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }
    
    // Test 2: Try to create a test bucket
    console.log('\n2. Testing bucket creation...')
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('test-bucket', {
      public: false,
      fileSizeLimit: 1024 * 1024 * 10 // 10MB
    })
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('✅ Bucket creation works (bucket already exists)')
      } else {
        console.log('❌ Error creating bucket:', createError.message)
      }
    } else {
      console.log('✅ Successfully created test bucket')
    }
    
    // Test 3: Check storage service health
    console.log('\n3. Storage service status:')
    console.log('   S3 URL:', supabaseUrl + '/storage/v1/s3')
    console.log('   Storage API URL:', supabaseUrl + '/storage/v1')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testStorage()
// Hybrid Supabase Client Configuration
// Local database + Remote storage setup

import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Configuration for hybrid setup
const config = {
  // Local database services
  local: {
    url: 'http://127.0.0.1:55431',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  // Remote storage services 
  remote: {
    url: 'https://ssuyesbkswzmzfucqwna.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Replace with your remote anon key
  }
}

// Client for database operations (local)
export const supabaseDb = createClient<Database>(config.local.url, config.local.anonKey!)

// Client for storage operations (remote)
export const supabaseStorage = createClient<Database>(config.remote.url, config.remote.anonKey!)

// Usage examples:
// Database operations (local):
// const { data } = await supabaseDb.from('applications').select('*')

// Storage operations (remote):  
// const { data } = await supabaseStorage.storage.from('documents').list()

export default supabaseDb
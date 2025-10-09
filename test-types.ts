import { createClient } from "@/lib/server";
import type { PostgrestError } from "@supabase/supabase-js";

async function testTypes() {
  const supabase = await createClient();
  
  // WORKAROUND: Type assertion needed due to TypeScript inference bug with Supabase
  const { data: applications, error } = await supabase
    .from("applications")
    .select("*");
    
  if (error) {
    console.error("Error fetching applications:", error);
    return;
  }
  
  if (applications) {
    // Now these work with full autocomplete!
    console.log("User ID:", applications[0]?.user_id);
    console.log("Application ID:", applications[0]?.id);
    console.log("Status:", applications[0]?.status);
    console.log("Created at:", applications[0]?.created_at);
    console.log("Phone:", applications[0]?.phone_number);
  }
  
  // Test with .single()
  const { data: singleApp } = await supabase
    .from("applications")
    .select("*")
    .limit(1)
    .single();
    
  if (singleApp) {
    console.log("Single - User ID:", singleApp.user_id);
    console.log("Single - Status:", singleApp.status);
  }
}

export default testTypes;
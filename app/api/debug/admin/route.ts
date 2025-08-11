import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createServiceClient } from '@/lib/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // Call is_admin() via RPC: use service client to bypass RLS just for the function eval & cross-check
  const service = await createServiceClient();
  const { data: roleCheck, error: roleCheckError } = await service.rpc('is_admin');

  // Try selecting applications with anon (current session)
  const { data: apps, error: appsError } = await supabase.from('applications').select('id').limit(1);

  return NextResponse.json({
    user: userData?.user,
    userError,
    is_admin_function_via_service: roleCheck,
    roleCheckError,
    applicationsQueryError: appsError,
    applicationsCountAttempt: apps?.length ?? 0,
  });
}

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

  // Also run is_admin() with the user session context (should be same truthy value)
  const { data: sessionRoleCheck, error: sessionRoleCheckError } = await supabase.rpc('is_admin');

  // Fetch the profile row (service to bypass RLS in case not visible yet)
  let profileRow = null as any;
  let profileRowError: any = null;
  let profileRowSession: any = null;
  let profileRowSessionError: any = null;
  if (userData?.user?.id) {
    const { data: profileData, error: profErr } = await service
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', userData.user.id)
      .maybeSingle();
    profileRow = profileData;
    profileRowError = profErr;

    const { data: profileDataSession, error: profSessErr } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', userData.user.id)
      .maybeSingle();
    profileRowSession = profileDataSession;
    profileRowSessionError = profSessErr;
  }

  // Service client attempt to bypass RLS for applications (should always succeed if service key present)
  const { data: appsService, error: appsServiceError } = await service
    .from('applications')
    .select('id', { count: 'exact', head: true });

  // Try selecting applications with anon (current session)
  const { data: apps, error: appsError } = await supabase.from('applications').select('id').limit(1);

  return NextResponse.json({
    user: userData?.user,
    userError,
  profileRow,
  profileRowError,
  profileRowSession,
  profileRowSessionError,
  is_admin_function_via_service: roleCheck,
  roleCheckError,
  is_admin_function_via_session: sessionRoleCheck,
  sessionRoleCheckError,
    applicationsQueryError: appsError,
    applicationsCountAttempt: apps?.length ?? 0,
  applicationsQueryServiceError: appsServiceError,
  serviceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}

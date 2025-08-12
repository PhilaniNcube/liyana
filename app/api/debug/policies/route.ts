import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const svc = await createServiceClient();
  // Cast to any because generated types don't yet include debug_list_policies function
  const { data: appsPolicies, error: appsPoliciesError } = await (svc as any).rpc('debug_list_policies', { target: 'applications' });
  const { data: profilesPolicies, error: profilesPoliciesError } = await (svc as any).rpc('debug_list_policies', { target: 'profiles' });
  const { data: allPolicies, error: allPoliciesError } = await (svc as any).rpc('debug_list_policies_all');
  return NextResponse.json({
    appsPolicies,
    appsPoliciesError,
    profilesPolicies,
    profilesPoliciesError,
  allPoliciesCount: Array.isArray(allPolicies) ? allPolicies.length : null,
    allPoliciesError
  });
}

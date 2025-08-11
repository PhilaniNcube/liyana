import { createClient } from "@/lib/server";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = await supabase.rpc("is_admin");

  console.log(isAdmin);

  if (!user) {
    throw new Error("User not authenticated");
  }

  // At this point, middleware has already verified the user is authenticated and is an admin
  return user;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar user={user} />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

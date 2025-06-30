"use client";

import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <Button onClick={logout}>
      <LogOutIcon className="h-4 w-4 mr-1" />
      Logout
    </Button>
  );
}

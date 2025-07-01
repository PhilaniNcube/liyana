"use client";

import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logoutAction();
    });
  };

  return (
    <Button onClick={handleLogout} disabled={isPending}>
      <LogOutIcon className="h-4 w-4 mr-1" />
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}

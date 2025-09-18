import React from "react";
import { LogoutButton } from "./logout-button";
import { getCurrentUser } from "@/lib/queries/user";
import { Button } from "./ui/button";
import { MobileNavLink } from "./mobile-nav-link";

const MobileAuthLinks = async () => {
  const currentUser = await getCurrentUser();

  return (
    <div className="pt-4 border-t">
      {currentUser ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Welcome, {currentUser.full_name}!
          </p>
          <div className="flex flex-col space-y-2">
            <MobileNavLink href="/apply">
              <Button variant="outline" size="sm" className="w-full">
                Apply for Loan
              </Button>
            </MobileNavLink>
            <MobileNavLink href="/profile">
              <Button variant="outline" size="sm" className="w-full">
                My Profile
              </Button>
            </MobileNavLink>
            {currentUser.role === "admin" && (
              <MobileNavLink href="/dashboard">
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Dashboard
                </Button>
              </MobileNavLink>
            )}
            <LogoutButton />
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <MobileNavLink href="/auth/login">
            <Button variant="outline" size="sm" className="w-full">
              Login
            </Button>
          </MobileNavLink>
          <MobileNavLink href="/auth/sign-up">
            <Button size="sm" className="w-full">
              Sign Up
            </Button>
          </MobileNavLink>
        </div>
      )}
    </div>
  );
};

export default MobileAuthLinks;

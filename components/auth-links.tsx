import React from "react";
import { LogoutButton } from "./logout-button";
import Link from "next/link";
import { getCurrentUser } from "@/lib/queries/user";

const AuthLinks = async () => {
  const currentUser = await getCurrentUser();

  console.log("Current user:", currentUser);

  return (
    <>
      {" "}
      {currentUser && currentUser.role === "admin" && (
        <Link
          href="/dashboard"
          className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
        >
          Dashboard
        </Link>
      )}
      {currentUser ? (
        <>
          <Link
            href="/profile"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Profile
          </Link>
          <LogoutButton />
        
        </>
      ) : (
        <>
          <Link
            href="/auth/login"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Login
          </Link>
        </>
      )}
    </>
  );
};

export default AuthLinks;

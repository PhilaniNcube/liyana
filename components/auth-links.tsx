
import { LogoutButton } from "./logout-button";
import Link from "next/link";
import { createClient } from "@/lib/server";
import { getCurrentUser } from "@/lib/queries";

const AuthLinks = async () => {

  const supabase = await createClient();


  const user = await getCurrentUser();

  const {data: isAdmin} = await supabase.rpc('is_admin')







  return (
    <>
      {" "}
      {isAdmin && (
        <Link
          href="/dashboard"
          className="text-sm font-medium bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
        >
          Dashboard
        </Link>
      )}
      {user ? (
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

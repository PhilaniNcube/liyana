import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

import MobileNavigation from "./mobile-navigation";
import { getCurrentUser } from "@/lib/queries";
import { LogOutIcon } from "lucide-react";
import { LogoutButton } from "./logout-button";

export async function Navigation() {
  // get the current user
  const currentUser = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="hidden mx-auto container md:flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex flex-col items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="Liyana Finance"
              width={256}
              height={52.4}
              className="w-56 object-cover hidden md:block"
            />
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="#contact"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Contact
          </Link>
          {currentUser ? (
            <>
              <Link
                href="/apply"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Apply
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Profile
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
          )}
        </nav>{" "}
      </div>

      <div className="md:hidden flex items-center">
        <MobileNavigation currentUser={currentUser} />
      </div>
    </header>
  );
}

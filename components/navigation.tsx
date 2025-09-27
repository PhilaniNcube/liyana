import Image from "next/image";
import Link from "next/link";

import MobileNavigation from "./mobile-navigation";

import AuthLinks from "./auth-links";
import { Suspense } from "react";

export async function Navigation() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="hidden mx-auto max-w-7xl md:flex h-16 items-center justify-between px-4 md:px-0">
        <div className="flex items-center space-x-2">
          <Link
            href="https://liyanafinance.co.za"
            className="flex flex-col items-center space-x-2"
          >
            <Image
              src="/logo.webp"
              alt="Liyana Finance"
              loading="eager"
              width={256}
              height={52.4}
              className="w-56 object-cover hidden md:block"
            />
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/contact"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/apply"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Apply
          </Link>
          <Suspense
            fallback={
              <div className="text-sm font-medium flex gap-x-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            }
          >
            <AuthLinks />
          </Suspense>
        </nav>{" "}
      </div>

      <div className="md:hidden flex items-center">
        <MobileNavigation />
      </div>
    </header>
  );
}

import Link from "next/link";
import Image from "next/image";
import React, { Suspense } from "react";
import { MobileSheetWrapper } from "./mobile-sheet-wrapper";
import { MobileNavLink } from "./mobile-nav-link";
import MobileAuthLinks from "./mobile-auth-links";

const MobileNavigation = () => {
  return (
    <div className="md:hidden w-full">
      <div className="flex items-center justify-between w-full px-4 py-3 border-b bg-background">
        <Link href="https://liyanafinance.co.za" className="flex items-center">
          <Image
            src="/square.jpg"
            alt="Liyana Logo"
            width={500}
            height={500}
            className="h-8 w-8"
          />
          <span className="ml-2 text-lg uppercase font-bold">
            Liyana Finance
          </span>
        </Link>

        <MobileSheetWrapper>
          <MobileNavLink
            href="#contact"
            className="block text-sm font-medium hover:text-primary transition-colors py-2"
          >
            Contact
          </MobileNavLink>
          <Suspense
            fallback={
              <div className="text-sm font-medium flex gap-x-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            }
          >
            <MobileAuthLinks />
          </Suspense>
        </MobileSheetWrapper>
      </div>
    </div>
  );
};

export default MobileNavigation;

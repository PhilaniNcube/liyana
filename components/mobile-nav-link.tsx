"use client";

import Link from "next/link";
import React, { useContext } from "react";

// Context for passing closeSheet function
const MobileNavContext = React.createContext<{ closeSheet?: () => void }>({});

export const MobileNavProvider = MobileNavContext.Provider;
export const useMobileNav = () => useContext(MobileNavContext);

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const MobileNavLink = ({
  href,
  children,
  className,
}: MobileNavLinkProps) => {
  const { closeSheet } = useMobileNav();

  return (
    <Link href={href} className={className} onClick={closeSheet}>
      {children}
    </Link>
  );
};

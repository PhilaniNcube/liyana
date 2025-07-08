"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { LogoutButton } from "./logout-button";
import type { CurrentUser } from "@/lib/queries";

interface MobileNavigationProps {
  currentUser: CurrentUser | null;
}

const MobileNavigation = ({ currentUser }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSheet = () => setIsOpen(false);
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

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] px-6">
            <SheetHeader>
              <SheetTitle>Liyana Finance</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col space-y-4 mt-6">
              <Link
                href="#contact"
                className="block text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={closeSheet}
              >
                Contact
              </Link>
              <div className="pt-4 border-t">
                {currentUser ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Welcome, {currentUser.full_name}!
                    </p>
                    <div className="flex flex-col space-y-2">
                      <Link href="/apply" onClick={closeSheet}>
                        <Button variant="outline" size="sm" className="w-full">
                          Apply for Loan
                        </Button>
                      </Link>
                      <Link href="/profile" onClick={closeSheet}>
                        <Button variant="outline" size="sm" className="w-full">
                          My Profile
                        </Button>
                      </Link>
                      {currentUser.role === "admin" && (
                        <Link href="/dashboard" onClick={closeSheet}>
                          <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Dashboard
                          </Button>
                        </Link>
                      )}
                      <LogoutButton />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link href="/auth/login" onClick={closeSheet}>
                      <Button variant="outline" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/sign-up" onClick={closeSheet}>
                      <Button size="sm" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileNavigation;

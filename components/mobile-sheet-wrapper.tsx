"use client";

import { Menu } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { MobileNavProvider } from "./mobile-nav-link";

interface MobileSheetWrapperProps {
  children: React.ReactNode;
}

export const MobileSheetWrapper = ({ children }: MobileSheetWrapperProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSheet = () => setIsOpen(false);

  return (
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
        <MobileNavProvider value={{ closeSheet }}>
          <nav className="flex flex-col space-y-4 mt-6">{children}</nav>
        </MobileNavProvider>
      </SheetContent>
    </Sheet>
  );
};

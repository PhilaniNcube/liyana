"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  User,
  CreditCard,
  Shield,
  Settings,
  Menu,
  X,
  CoinsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface ProfileSidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: "Overview",
    href: "/profile",
    icon: User,
    description: "Dashboard overview",
  },
  {
    title: "My Loans",
    href: "/profile/my-loans",
    icon: CreditCard,
    description: "View active and past loans",
  },
  {
    title: "My Policies",
    href: "/profile/my-policies",
    icon: Shield,
    description: "Manage funeral policies",
  },
  {
    title: "My Claims",
    href: "/profile/my-claims",
    icon: CoinsIcon,
    description: "Manage funeral policy claims",
  },
];

export function ProfileSidebar({ className }: ProfileSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col space-y-2 p-4 h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>
      <nav className="space-y-1 flex-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span
                  className={cn(
                    "text-xs transition-colors",
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground/70 group-hover:text-foreground/70"
                  )}
                >
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:block w-64 border-r bg-card/50 backdrop-blur-sm sticky top-0 h-screen",
          className
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}

// Export mobile menu separately
export function ProfileMobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col space-y-2 p-4 h-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
          <nav className="space-y-1 flex-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    <span
                      className={cn(
                        "text-xs transition-colors",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground/70 group-hover:text-foreground/70"
                      )}
                    >
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
